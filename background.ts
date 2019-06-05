/**
 * `background.ts` is where the adblocker actually lives. It is started once
 * and keeps the state in memory. From there we can monitor network requests
 * using the webRequest API and communicate with the `content-script.ts` to
 * specify which actions should be taken (e.g.: injecting custom stylesheets or
 * scriptlets in pages).
 */

import { ENGINE_VERSION, WebExtensionEngine } from '@cliqz/adblocker';

/**
 * Initialize the adblocker from a pre-built serialized FiltersEngine served by
 * Cliqz' CDN. This allows the adblocker to start extremely fast since no
 * expensive parsing is required.
 */
async function loadAdblocker(): Promise<WebExtensionEngine> {
  // Fetch `allowed-lists.json` from CDN. It contains information about where
  // to find pre-built engines as well as lists of filters (e.g.: Easylist,
  // etc.).
  const { engines } = await (await fetch(
    'https://cdn.cliqz.com/adblocker/configs/desktop-ads-trackers/allowed-lists.json',
  )).json();

  // Once we have the config, we can get the URL of the pre-built engine
  // corresponding to our installed @cliqz/adblocker version (i.e.:
  // ENGINE_VERSION). This guarantees that we can download a compabitle one.
  return WebExtensionEngine.deserialize(
    new Uint8Array(
      await (await fetch(engines[ENGINE_VERSION].url)).arrayBuffer(),
    ),
  ) as WebExtensionEngine;
}

/**
 * Keep track of number of network requests altered (i.e.: blocked or
 * redirected) for each open tab.
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
  counter.set(
    tabId,
    (reset === true ? 0 : counter.get(tabId) || 0) + (incr === true ? 1 : 0),
  );

  chrome.browserAction.setBadgeText({
    text: '' + (counter.get(tabId) || 0),
  });
}

// Whenever the active tab changes, we update the count of blocked requests
chrome.tabs.onActivated.addListener(({ tabId }: chrome.tabs.TabActiveInfo) =>
  updateBlockedCounter(tabId),
);

// Wait for adblocker to be initialized before starting listening to requests
loadAdblocker().then((engine) => {
  // The `onBeforeRequest` hook allows us to listen to network requests before
  // they leave the browser. We then have a chance to cancel them or redirect
  // them to local resources. We use the engine to decide what to do.
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      // Check if request should be either redirected to local resource or blocked
      const blockingResponse = engine.onBeforeRequest(details);

      // Update the counter of altered requests. If the request is a main_frame
      // the counter is reset to 0. If the request is either blocked or
      // redirected, then the counter is also incremented.
      updateBlockedCounter(details.tabId, {
        incr: Boolean(blockingResponse.cancel || blockingResponse.redirectUrl),
        reset: details.type === 'main_frame',
      });

      // `blockingResponse` indicates if the request should be allowed, blocked or redirected
      return blockingResponse;
    },
    {
      urls: ['<all_urls>'],
    },
    ['blocking'],
  );

  // The `onHeadersReceived` listener allows us to intercept 'main_frame'
  // requests (i.e.: main document load) and inject CSP headers when required.
  chrome.webRequest.onHeadersReceived.addListener(
    (details) => engine.onHeadersReceived(details),
    { urls: ['<all_urls>'], types: ['main_frame'] },
    ['blocking', 'responseHeaders'],
  );

  // Start listening to messages coming from the content script. Whenever a new
  // frame is created (either a main document or iframe), it will be requesting
  // cosmetics to inject in the DOM. We listen for messages and send back
  // styles and scripts to inject to block/hide ads.
  chrome.runtime.onMessage.addListener((...args) =>
    engine.onRuntimeMessage(...args),
  );

  console.log('Ready to roll!');
});
