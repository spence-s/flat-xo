# Flat XO

A reimplementation of xo linter (https://github.com/xojs/xo) powered by a single eslint flat config.

## Status

The linter currently works for some javascript files with a simple user configuration. It doesn't respect all options properly and much work needs to still be done to get it to a production state.

However, initial results from the working code show a significant performance loss with lint times taking many more seconds than the current implementation.

This may be due to trying to do too much in a flat eslint config, since I attempted to put the entire functionality of xo in a single exportable eslint config.

I even set it up to work with the vscode extension where the eslint instance would be cached, but this did not improve performance.

So at this point, I have abandoned this effort and will wait until ESLint decides to deprecate the legacy config and provide more insight into the performance characteristics of the flat config implementation.

