# Blockrz

Build yourself an adblocker in 100 lines of TypeScript! This is
a minimal webextension doing adblocking/antitracking using most
popular block-lists. It is meant as a very thin wrapper around the
[adblocker](https://github.com/cliqz-oss/adblocker) library which does
most of the heavy-lifting. The code is also heavily commented and aims
at explaining how a modern content-blocker works.

## Building

1. Build the extension: `npm install && npm run build && npm run bundle`
2. Load it in Firefox or Chromium by using the "Load unpacked extension" feature

## FAQ

> Is it really a 100 lines of code?

Yes.

```sh
$ loc *.ts

--------------------------------------------------------------------------------
 Language             Files        Lines        Blank      Comment         Code
--------------------------------------------------------------------------------
 TypeScript               2          187           22           65          100
--------------------------------------------------------------------------------
 Total                    2          187           22           65          100
--------------------------------------------------------------------------------
```

> It's tiny, does it actually perform like other blocker extensions?

Yes it is small, but it leverages `@cliqz/adblocker` to do the heavy-lifting.
This means that the extension is doing as much as any other block (if you make
abstraction of the UI, of course).
