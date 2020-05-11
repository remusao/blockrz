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
 * Helper function used to both reset, increment and show the current value of
 * the blocked requests counter for a given tabId.
 */
function updateBlockedCounter(
  tabId: number,
  { reset = false, incr = false } = {},
) {
  chrome.tabs.query({ active: true }, (tabs) => {
    if (tabs.length === 1) {
      const { id } = tabs[0];
      if (id !== undefined) {
        chrome.browserAction.setBadgeText({
          text: '' + (counter.get(id) || 0),
        });
      }
    }
  });

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
chrome.tabs.onActivated.addListener(({ tabId }: chrome.tabs.TabActiveInfo) =>
  updateBlockedCounter(tabId),
);

// Reset counter if tab is reloaded
chrome.tabs.onUpdated.addListener((tabId, { status, url }) => {
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

  chrome.browserAction.onClicked.addListener(() => {
    if (blocker.isBlockingEnabled(browser)) {
      blocker.disableBlockingInBrowser(browser);
      chrome.browserAction.setBadgeBackgroundColor({ color: '#FF0000' });
    } else {
      blocker.enableBlockingInBrowser(browser);
      chrome.browserAction.setBadgeBackgroundColor({ color: '#00AEF0' });
    }
    chrome.tabs.reload();
  });
});
