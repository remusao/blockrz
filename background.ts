/**
 * `background.ts` is where the adblocker actually lives. It is started once
 * and keeps the state in memory. From there we can monitor network requests
 * using the webRequest API and communicate with the `content-script.ts` to
 * specify which actions should be taken (e.g.: injecting custom stylesheets or
 * scriptlets in pages).
 */

import { browser } from 'webextension-polyfill-ts';
import { BlockingResponse, Request, WebExtensionBlocker } from '@cliqz/adblocker-webextension';

/**
 * Keep track of number of network requests altered for each tab
 */
const counter: Map<number, number> = new Map();

/**
 * Helper function used to both reset, increment and show the current value of
 * the blocked requests counter for a given tabId.
 */
function updateBlockedCounter(tabId: number, { reset = false, incr = false } = {}) {
  counter.set(tabId, (reset === true ? 0 : counter.get(tabId) || 0) + (incr === true ? 1 : 0));

  browser.browserAction.setBadgeText({
    text: '' + (counter.get(tabId) || 0),
  });
}

function incrementBlockedCounter(request: Request, blockingResponse: BlockingResponse): void {
  updateBlockedCounter(request.tabId, {
    incr: Boolean(blockingResponse.match),
    reset: request.isMainFrame(),
  });
}

// Whenever the active tab changes, then we update the count of blocked request
browser.tabs.onActivated.addListener(({ tabId }) =>
  updateBlockedCounter(tabId),
);

// Reset counter if tab is reloaded
browser.tabs.onUpdated.addListener((tabId, { status }) => {
  if (status === 'loading') {
    updateBlockedCounter(tabId, {
      incr: false,
      reset: true,
    });
  }
});

WebExtensionBlocker.fromPrebuiltAdsAndTracking().then((blocker: WebExtensionBlocker) => {
  blocker.enableBlockingInBrowser(browser);
  blocker.on('request-blocked', incrementBlockedCounter);
  blocker.on('request-redirected', incrementBlockedCounter);
  console.log('Ready to roll!');
});
