
&nbsp;
<p align="center">
  <img src="https://raw.githubusercontent.com/remusao/blockrz/master/banner-light.png" width="300px" alt="ATO Blocker" />
</p>
<h3 align="center">Super minimal blocker of ads, trackers and annoyances</h3>

<p align="center">
  <em>
    Efficient
    · Minimal
    · Adblocker
    · Privacy
  </em>
</p>

<p align="center">
  <a href="https://cliqz.com" target="_blank" rel="noopener noreferrer">
    <img alt="powered by Cliqz" src="https://img.shields.io/badge/cliqz-powered-blue?logo=cliqz&style=flat-square">
  </a>
  <a href="https://twitter.com/pythux">
    <img alt="Follow me on Twitter" src="https://img.shields.io/twitter/follow/pythux.svg?logo=twitter&label=follow&style=flat-square"></a>
  <a href="https://github.com/remusao/blockrz/blob/master/LICENSE">
    <img alt="License Badge" src="https://img.shields.io/github/license/remusao/blockrz?style=flat-square"></a>
</p>

-----

A super minimal blocker of ads, trackers and annoyances which works out of the box:

* Blocks ads.
* Blocks tracking.
* Blocks annoyances.
* Very small memory and CPU footprint(*).
* Fast loading time(**).

This extension does not offer options to configure the behavior of the extension and is aimed at people who want a content blocker which just works out of the box. To this effect, the developer of this addon has carefully selected a set of stable and widely used filters lists, updated daily. The following lists are used by default:

* EasyList (ads)
* EasyList Cookies (annoyances)
* Peter Lowe’s Ad server list (ads and tracking)
* EasyPrivacy (tracking)
* uBlock filters (ads + tracking + annoyances)

(*) The source code weighs ~70KB gzipped and ~190KB uncompressed. The raw memory usage is less than 5MB (1.7MB reported in about:performance), which is smaller than any other adblocker extension.

(**) The blocker is initialized in less than 200ms, even on cold start, which means that ads and trackers are blocked as soon as your browser starts.

## Building

Building code from https://github.com/remusao/blockrz can be done with:

1. Build the extension: `yarn install --frozen-lock && yarn bundle`
2. Load it in Firefox or Chromium by using the "Load unpacked extension" feature

## FAQ

> Is it really less than 100 lines of code?

Yes.

```sh
$ loc content-script.ts background.ts
--------------------------------------------------------------------------------
 Language             Files        Lines        Blank      Comment         Code
--------------------------------------------------------------------------------
 TypeScript               2          132           14           60           58
--------------------------------------------------------------------------------
 Total                    2          132           14           60           58
--------------------------------------------------------------------------------
```

> It's tiny, does it actually perform like other blocker extensions?

Yes it is small, but it leverages
[@cliqz/adblocker](https://github.com/cliqz-oss/adblocker) to do the
heavy-lifting. This means that the extension is doing as much as any other
content-blocker (if you make abstraction of the UI, of course, which only
consists in a counter of blocked requests). At the time of this writing, this
is still the fastest and most memory efficient adblocker around.

> Which filters lists is it using?

Currently, it is using a pre-built engine distributed on Cliqz' CDN.
This means that no parsing is required client-side to load the engine
(super-fast loading cached between sessions!). The default lists at the
time of this writing are:

* [EasyList](https://easylist.to/easylist/easylist.txt)
* [EasyPrivacy](https://easylist.to/easylist/easyprivacy.txt)
* [Peter Lowe’s Ad and tracking server list](https://pgl.yoyo.org/adservers/serverlist.php?hostformat=adblockplus&showintro=0&mimetype=plaintext)
* [uBlock filters](https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt)
* [uBlock filters - Privacy](https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/privacy.txt)
* [uBlock filters - Resource abuse](https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/resource-abuse.txt)
* [uBlock filters - Badware risks](https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/badware.txt)
* [uBlock filters - Unbreak](https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/unbreak.txt)
