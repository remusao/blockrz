import {
  FiltersEngine,
  ENGINE_VERSION,
  makeRequest,
  updateResponseHeadersWithCSP,
  Request,
} from '@cliqz/adblocker';
import { parse } from 'tldts';

/**
 * Initialize the adblocker from pre-built serialized FiltersEngine served by
 * Cliqz' CDN. This allows the adblocker to initialize very fast since no
 * expensive parsing is required.
 */
async function loadAdblocker(): Promise<FiltersEngine> {
  // Fetch `allowed-lists.json` from CDN. It contains information about where
  // to find pre-built engines as well as lists of filters (e.g.: Easylist,
  // etc.).
  const { engines } = await (await fetch(
    'https://cdn.cliqz.com/adblocker/configs/desktop-ads-trackers/allowed-lists.json',
  )).json();

  // Once we have the config, we can get the URL of the pre-built engine
  // corresponding to our installed version (i.e.: ENGINE_VERSION). This makes
  // sure that we can download a compabitle one.
  return FiltersEngine.deserialize(
    new Uint8Array(
      await (await fetch(engines[ENGINE_VERSION].url)).arrayBuffer(),
    ),
  );
}

/**
 * Given `details` from webRequest' hooks, create an instance of `Request` as
 * required by the adblocker. This request will be used in conjunction with the
 * engine to decide what to do.
 */
function requestFromDetails({
  initiator,
  type,
  url,
}:
  | chrome.webRequest.WebRequestBodyDetails
  | chrome.webRequest.WebResponseHeadersDetails): Request {
  return makeRequest(
    {
      sourceUrl: initiator,
      type,
      url,
    },
    parse,
  );
}

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
  counter.set(
    tabId,
    (reset === true ? 0 : counter.get(tabId) || 0) + (incr === true ? 1 : 0),
  );

  chrome.browserAction.setBadgeText({
    text: '' + (counter.get(tabId) || 0),
  });
}

// Whenever the active tab changes, then we update the count of blocked request
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
      const { redirect, match } = engine.match(requestFromDetails(details));

      // Update the counter of altered requests. If the request is a main_frame
      // the counter is reset to 0. If the request is either blocked or
      // redirected, then the counter is also incremented.
      updateBlockedCounter(details.tabId, {
        incr: Boolean(redirect || match),
        reset: details.type === 'main_frame',
      });

      // Create blocking response { cancel, redirectUrl }
      if (redirect !== undefined) {
        return { redirectUrl: redirect };
      } else if (match === true) {
        return { cancel: true };
      }

      return {};
    },
    {
      urls: ['<all_urls>'],
    },
    ['blocking'],
  );

  // The `onHeadersReceived` listener allows us to intercept 'main_frame'
  // requests (i.e.: document load) and inject CSP headers when required.
  chrome.webRequest.onHeadersReceived.addListener(
    (details) =>
      updateResponseHeadersWithCSP(
        details,
        engine.getCSPDirectives(requestFromDetails(details)),
      ),
    { urls: ['<all_urls>'], types: ['main_frame'] },
    ['blocking', 'responseHeaders'],
  );

  // Start listening to messages coming from the content-script. Whenever a new
  // frame is created (either a main document or iframe), it will be requesting
  // cosmetics to inject in the DOM. We listen for messages and send back
  // styles and scripts to inject to block/hide ads.
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    // Answer to content-script with a list of nodes
    if (msg.action === 'getCosmeticsFilters') {
      const { hostname, domain } = parse(sender.url || '');
      sendResponse(
        engine.getCosmeticsFilters({
          domain: domain || '',
          hostname: hostname || '',
          url: sender.url || '',
        }),
      );
    }
  });

  console.log('Ready to roll!');
});
