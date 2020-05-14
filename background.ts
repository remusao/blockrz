/**
 * `background.ts` is where the adblocker actually lives. It is started once
 * and keeps the state in memory. From there we can monitor network requests
 * using the webRequest API and communicate with the `content-script.ts` to
 * specify which actions should be taken (e.g.: injecting custom stylesheets or
 * scriptlets in pages).
 */

import { get, set } from 'idb-keyval';
import { browser } from 'webextension-polyfill-ts';
import {
  BlockingResponse,
  Request,
  WebExtensionBlocker,
  fullLists,
} from '@cliqz/adblocker-webextension';

/**
 * Disable badge by default! Although in practice initialization should take
 * less than a second, it makes sense conceptually to not show an active badge
 * until the adblocker engine is initialized. Although unlikely, it also means
 * that the badge will stay inactive if the adblocker fails to initialize.
 */
browser.browserAction.disable();

/**
 * Keep track of number of network requests altered for each tab.
 */
const counter: Map<number, number> = new Map();

/**
 * Update badge with count for tab with id `tabId` using value from `counter`.
 */
function updateBadgeForTab(tabId: number): Promise<void> {
  return browser.browserAction.setBadgeText({
    text: '' + (counter.get(tabId) || 0),
  });
}

/**
 * Update badge with count for currently active tab using value from `counter`.
 */
async function updateBadgeForCurrentTab(): Promise<void> {
  const tabs = await browser.tabs.query({ active: true });
  if (tabs.length === 1) {
    const { id } = tabs[0];
    if (id !== undefined) {
      await updateBadgeForTab(id);
    }
  }
}

/**
 * Update badge with count for currently active tab using value from `counter`.
 * This function will also make sure that updates are throttled to not use too
 * much CPU when pages are loading and many network requests are triggered.
 */
let TIMER: NodeJS.Timeout | null = null;
function updateBadgeThrottled() {
  if (TIMER === null) {
    TIMER = setTimeout(async () => {
      TIMER = null;
      await updateBadgeForCurrentTab();
    }, 500);
  }
}

/**
 * Helper function used to both reset, increment and show the current value of
 * the blocked requests counter for a given tabId.
 */
function updateBlockedCounter(tabId: number, { reset = false, incr = false } = {}) {
  updateBadgeThrottled();
  counter.set(
    tabId,
    (reset ? 0 : (counter.get(tabId) || 0)) + (incr  ? 1 : 0),
  );
}

function incrementBlockedCounter(request: Request, response: BlockingResponse): void {
  updateBlockedCounter(request.tabId, {
    incr: Boolean(response.match),
    reset: request.isMainFrame(),
  });
}

// Whenever the active tab changes, then we update the count of blocked request
browser.tabs.onActivated.addListener(({ tabId }) => updateBadgeForTab(tabId));

// Reset counter if tab is reloaded
browser.tabs.onUpdated.addListener((tabId, { status, url }) => {
  if (status === 'loading' && url === undefined) {
    updateBlockedCounter(tabId, { incr: false, reset: true });
  }
});

function disable(blocker: WebExtensionBlocker) {
  blocker.disableBlockingInBrowser(browser);
  blocker.unsubscribe('request-blocked', incrementBlockedCounter);
  blocker.unsubscribe('request-redirected', incrementBlockedCounter);
}

function enable(blocker: WebExtensionBlocker) {
  blocker.enableBlockingInBrowser(browser);
  blocker.on('request-blocked', incrementBlockedCounter);
  blocker.on('request-redirected', incrementBlockedCounter);
}

(async () => {
  let blocker = WebExtensionBlocker.empty();
  enable(blocker);

  // Handle toggling of blocking based on clicking on the icon. The behavior is
  // currently to disable or enable the adblocker globally (and not on a per-tab
  // basis as might be expected); this is in line with the bare-bone spirit of
  // this extension.
  browser.browserAction.onClicked.addListener(async () => {
    browser.browserAction.setBadgeText({ text: '0' });
    if (blocker.isBlockingEnabled(browser)) {
      browser.browserAction.setIcon({ path: './icons/shield-disabled-128.png' });
      disable(blocker);
    } else {
      browser.browserAction.setIcon({ path: './icons/shield-128.png' });
      enable(blocker);
    }
  });

  // Handle hot-swapping an adblocker instance for another. It will gracefully
  // enable blocking with the new instance and disable the previous one. The new
  // instance is then stored globally in `blocker`.
  const upgrade = (newBlocker: WebExtensionBlocker) => {
    // We only enable blocking with newBlocker if we were already blocking in
    // `browser`. This allows to make sure we respect the toggling ON/OFF of the
    // adblocker, even on updates.
    if (blocker.isBlockingEnabled(browser)) {
      enable(newBlocker);
      disable(blocker);
    }

    // Keep new instance globally (and garbage collect previous one).
    blocker = newBlocker;
  };

  // Load from cache (IndexedBD) or pre-built in extension (a serialized engine
  // is shipped as part of the XPI and allows to initialize the adblocker very
  // fast on cold start). This allows to start the extension in less than 200ms.
  upgrade(WebExtensionBlocker.deserialize((await get('engine')) || new Uint8Array(
    await (await fetch(browser.runtime.getURL('engine.bin'))).arrayBuffer(),
  )));

  // Set status of badge to 'enabled' and set default value.
  browser.browserAction.enable();
  browser.browserAction.setBadgeText({ text: '0' });

  // Update from remote lists, we then wait a few seconds (~5 seconds) and
  // attempt a full update of the engine based on remote lists. This usually
  // takes a couple of seconds, mostly to fetch the resources.
  setTimeout(async () => {
    upgrade(await WebExtensionBlocker.fromLists(fetch, fullLists, blocker.config));
    await set('engine', blocker.serialize());
  }, 5000);
})();
