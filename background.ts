/**
 * `background.ts` is where the adblocker actually lives. It is started once
 * and keeps the state in memory. From there we can monitor network requests
 * using the webRequest API and communicate with the `content-script.ts` to
 * specify which actions should be taken (e.g.: injecting custom stylesheets or
 * scriptlets in pages).
 */

import { browser } from 'webextension-polyfill-ts';
import {
  BlockingResponse,
  Request,
  WebExtensionBlocker,
  fullLists,
} from '@cliqz/adblocker-webextension';

/**
 * Keep track of number of network requests altered for each tab
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
const updateBadgeThrottled = (() => {
  let timer: NodeJS.Timeout | null = null;
  return () => {
    if (timer === null) {
      timer = setTimeout(async () => {
        console.log('Update badge');
        timer = null;
        await updateBadgeForCurrentTab();
      }, 1000);
    }
  };
})();

/**
 * Helper function used to both reset, increment and show the current value of
 * the blocked requests counter for a given tabId.
 */
function updateBlockedCounter(
  tabId: number,
  { reset = false, incr = false } = {},
) {
  updateBadgeThrottled();
  counter.set(
    tabId,
    (reset === true ? 0 : counter.get(tabId) || 0) + (incr === true ? 1 : 0),
  );
}

function incrementBlockedCounter(
  request: Request,
  blockingResponse: BlockingResponse,
): void {
  updateBlockedCounter(request.tabId, {
    incr: Boolean(blockingResponse.match),
    reset: request.isMainFrame(),
  });
}

// Whenever the active tab changes, then we update the count of blocked request
browser.tabs.onActivated.addListener(({ tabId }) => updateBadgeForTab(tabId));

// Reset counter if tab is reloaded
browser.tabs.onUpdated.addListener((tabId, { status, url }) => {
  if (status === 'loading' && url === undefined) {
    updateBlockedCounter(tabId, {
      incr: false,
      reset: true,
    });
  }
});

WebExtensionBlocker.fromLists(fetch, fullLists, {
  enableCompression: true,
  enableHtmlFiltering: true,
}).then((blocker: WebExtensionBlocker) => {
  blocker.enableBlockingInBrowser(browser);
  blocker.on('request-blocked', incrementBlockedCounter);
  blocker.on('request-redirected', incrementBlockedCounter);
  console.log('Ready to roll!');

  browser.browserAction.onClicked.addListener(() => {
    if (blocker.isBlockingEnabled(browser)) {
      blocker.disableBlockingInBrowser(browser);
      browser.browserAction.setBadgeBackgroundColor({ color: '#FF0000' });
    } else {
      blocker.enableBlockingInBrowser(browser);
      browser.browserAction.setBadgeBackgroundColor({ color: '#00AEF0' });
    }
    browser.tabs.reload();
  });
});
