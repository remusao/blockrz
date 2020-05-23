/**
 * `background.ts` is where the adblocker actually lives. It is started once
 * and keeps the state in memory. From there we can monitor network requests
 * using the webRequest API and communicate with the `content-script.ts` to
 * specify which actions should be taken (e.g.: injecting custom stylesheets or
 * scriptlets in pages).
 */

import { get, set } from 'idb-keyval';
import { browser } from 'webextension-polyfill-ts';
import { Badge } from '@remusao/badger';
import { WebExtensionBlocker, fullLists } from '@cliqz/adblocker-webextension';

function disable(blocker: WebExtensionBlocker, incrementBlockedCounter: (_: { tabId: number; }) => void) {
  blocker.disableBlockingInBrowser(browser);
  blocker.unsubscribe('request-blocked', incrementBlockedCounter);
  blocker.unsubscribe('request-redirected', incrementBlockedCounter);
}

function enable(blocker: WebExtensionBlocker, incrementBlockedCounter: (_: { tabId: number; }) => void) {
  blocker.enableBlockingInBrowser(browser);
  blocker.on('request-blocked', incrementBlockedCounter);
  blocker.on('request-redirected', incrementBlockedCounter);
}

(async () => {
  let blocker = WebExtensionBlocker.empty();
  const badge = new Badge({
    badgeTextColor: 'white',
    badgeBackgroundColor: [0, 174, 240, 150],
    iconDisabled: './icons/icon-off.png',
    iconEnabled: [
      './icons/icon-o-0.png',
      './icons/icon-o-1.png',
      './icons/icon-o-3.png',
      './icons/icon-o-5.png',
      './icons/icon-o-6.png',
    ],
    minimumUpdateLatency: 300,
  });

  const incrementBlockedCounter = ({ tabId }: { tabId: number; }) => badge.incr(tabId);
  badge.enable();
  enable(blocker, incrementBlockedCounter);

  // Handle toggling of blocking based on clicking on the icon. The behavior is
  // currently to disable or enable the adblocker globally (and not on a per-tab
  // basis as might be expected); this is in line with the bare-bone spirit of
  // this extension.
  browser.browserAction.onClicked.addListener(async () => {
    if (blocker.isBlockingEnabled(browser)) {
      badge.disable();
      disable(blocker, incrementBlockedCounter);
    } else {
      badge.enable();
      enable(blocker, incrementBlockedCounter);
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
      enable(newBlocker, incrementBlockedCounter);
      disable(blocker, incrementBlockedCounter);
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

  // Update from remote lists, we then wait a few seconds (~5 seconds) and
  // attempt a full update of the engine based on remote lists. This usually
  // takes a couple of seconds, mostly to fetch the resources.
  setTimeout(async () => {
    upgrade(await WebExtensionBlocker.fromLists(fetch, fullLists, blocker.config));
    await set('engine', blocker.serialize());
  }, 5000);
})();
