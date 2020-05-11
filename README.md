# Blockrz

Build yourself an adblocker in less than 100 lines of TypeScript! This
is a minimal WebExtension doing adblocking/antitracking using most
popular block-lists. It is meant as a very thin wrapper around the
[adblocker](https://github.com/cliqz-oss/adblocker) library which does
most of the heavy-lifting. The code is also heavily commented and aims
at explaining how a modern content-blocker works. This is a didactic
project and contributions to improve it are more than welcome.

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
 TypeScript               2          125           11           44           70
--------------------------------------------------------------------------------
 Total                    2          125           11           44           70
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
* Cliqz and WhoTracks.me custom filters
