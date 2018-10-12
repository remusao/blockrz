import * as adblocker from "@cliqz/adblocker";

/**
 * Initialize the adblocker using lists of filters and resources. It returns a
 * Promise resolving on the `Engine` that we will use to decide what requests
 * should be blocked or altered.
 */
function loadAdblocker() {
  const engine = new adblocker.FiltersEngine({
    enableOptimizations: true,
    loadCosmeticFilters: true,
    loadNetworkFilters: true,
    optimizeAOT: true,
    version: 1
  });

  console.log("Fetching resources...");
  return Promise.all([adblocker.fetchLists(), adblocker.fetchResources()]).then(
    ([responses, resources]) => {
      console.log("Initialize adblocker...");
      engine.onUpdateResource([{ filters: resources, checksum: "" }]);
      engine.onUpdateFilters(
        responses.map((filters, i) => ({
          asset: "" + i,
          checksum: "",
          filters
        })),
        new Set()
      );

      return engine;
    }
  );
}

/**
 * Because the WebRequest API does not give us access to the URL of the page
 * each request comes from (but we know from which tab they originate), we need
 * to independently keep a mapping from tab ids to source URLs. This information
 * is needed by the adblocker (some filters only apply on specific domains).
 */
const tabs = new Map();

function resetState(tabId, source) {
  tabs.set(tabId, { source, count: 0 });
}

function updateBadgeCount(tabId) {
  if (tabs.has(tabId)) {
    const { count } = tabs.get(tabId);
    chrome.browserAction.setBadgeText({ text: "" + count });
  }
}

function incrementBlockedCounter(tabId) {
  if (tabs.has(tabId)) {
    const tabStats = tabs.get(tabId);
    tabStats.count += 1;
    updateBadgeCount(tabId);
  }
}

chrome.tabs.onCreated.addListener(tab => {
  resetState(tab.id, tab.url);
  updateBadgeCount(tab.id);
});

chrome.tabs.onUpdated.addListener((_0, _1, tab) => {
  if (tabs.has(tab.id)) {
    const { source } = tabs.get(tab.id);
    if (source !== tab.url) {
      resetState(tab.id, tab.url);
      updateBadgeCount(tab.id);
    }
  }
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  updateBadgeCount(tabId);
});

loadAdblocker().then(engine => {
  function listener(details) {
    let source;
    if (tabs.has(details.tabId)) {
      source = tabs.get(details.tabId).source;
    }

    const result = engine.match({
      cpt: details.type,
      sourceUrl: source,
      url: details.url
    });

    if (result.redirect !== undefined) {
      incrementBlockedCounter(details.tabId);
      return { redirectUrl: result.redirect };
    } else if (result.match === true) {
      incrementBlockedCounter(details.tabId);
      return { cancel: true };
    }

    return {};
  }

  // Start listening to requests, and allow 'blocking' so that we can cancel
  // some of them (or redirect).
  chrome.webRequest.onBeforeRequest.addListener(
    listener,
    {
      urls: ["*://*/*"]
    },
    ["blocking"]
  );

  // Start listening to messages coming from the content-script
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    // Extract hostname from sender's URL
    const url = sender.url;
    let hostname = "";
    if (url !== undefined) {
      hostname = new URL(url).hostname;
    }

    // Answer to content-script with a list of nodes
    if (msg.action === "getCosmeticsForDomain") {
      sendResponse(engine.getDomainFilters(hostname));
    } else if (msg.action === "getCosmeticsForNodes") {
      sendResponse(engine.getCosmeticsFilters(hostname, msg.args[0]));
    }
  });

  console.log("Ready to roll!");
});
