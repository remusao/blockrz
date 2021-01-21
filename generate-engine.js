const { writeFileSync } = require('fs');

const fetch = require('node-fetch');

const {
  WebExtensionBlocker,
  fullLists,
} = require('@cliqz/adblocker-webextension');

(async () => {
  console.log('Generate pre-built adblocker engine...');
  writeFileSync(
    'engine.bin',
    (
      await WebExtensionBlocker.fromLists(fetch, fullLists, {
        debug: false,
        enableCompression: true,
        enableHtmlFiltering: true,
        enableMutationObserver: true,
        enableOptimizations: true,
        guessRequestTypeFromUrl: false,
        integrityCheck: true,
        loadCosmeticFilters: true,
        loadExtendedSelectors: true,
        loadGenericCosmeticsFilters: true,
        loadNetworkFilters: true,
      })
    ).serialize(),
  );
})();
