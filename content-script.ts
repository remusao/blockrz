/**
 * The `content-script.ts` code is injected in every frame of every page you
 * visit. It is very lightweight and only needed to fine-tune the blocking of
 * ads and tracking. Not all ads can be removed at the network filtering level
 * (check `background.ts` for more information) and some ads need to be hidden
 * instead. Moreover, some websites deploy counter-measures to try and defuse
 * the adblocker, which often requires intervention in the page itself; that is
 * the role of the content script. Last but not least, the code in
 * content-script.ts will also monitor the DOM (representation of the page) for
 * mutations and will take action if extra blocking needs to be applied (e.g.:
 * if a new ad is being loaded).
 */

import {
  injectCosmetics,
} from '@cliqz/adblocker-webextension-cosmetics';

/**
 * All the filters and matching logic lives in the background of the extension,
 * the content script needs a way to request relevant cosmetic filters for each
 * frame. This communication can be handled in several ways (e.g.: `connect` or
 * `sendMessage`). By default, `sendMessage` is used.
 *
 * The background should listen to these messages and answer back with lists of
 * filters to be injected in the page, as well as scriplets (small
 * self-contained programs) which should be injected.
 *
 * `injectCosmetics` is in charge of all ad-blocking logic on the content-script
 * side. It handles the following:
 * - Requests information from background
 * - Monitor DOM changes and informs background
 * - Injects scriplets returned by background into frames
 */
injectCosmetics(window, true /* observe DOM mutations */);
