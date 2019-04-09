import { IMessageFromBackground, injectCosmetics } from '@cliqz/adblocker';

/**
 * Because all the filters and matching logic lives in the background of the
 * extension, the content script needs a way to request relevant cosmetic
 * filters for each frame. This channel of communication can be handled in
 * several ways (`connect`, `sendMessage`). Here we will make use of
 * `sendMessage` for one-off communications.
 *
 * `getCosmeticsFilters` wraps the logic of communicating with the background
 * and will be used to request cosmetics filters for the current frame.
 *
 * The background should listen to these messages and answer back with lists of
 * filters to be injected in the page.
 */
const getCosmeticsFilters = (): Promise<IMessageFromBackground> => {
  return new Promise((resolve) =>
    chrome.runtime.sendMessage({ action: 'getCosmeticsFilters' }, resolve),
  );
};

/**
 * `injectCosmetics` is in charge of all ad-blocking logic on the content-script
 * side. It handles the following:
 * - Inject scripts into the page, which might be used to defuse anti-adblockers.
 * - Inject custom stylesheets to hide some ads.
 */
injectCosmetics(window, getCosmeticsFilters, false);
