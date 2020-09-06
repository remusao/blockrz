#!/usr/bin/env sh

rm -fr firefox
wget 'https://download.mozilla.org/?product=firefox-nightly-latest&os=linux64&lang=en-US' -O firefox.tar.bz2
tar xjvf firefox.tar.bz2
rm -f firefox.tar.bz2
