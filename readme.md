[![Node.js CI](https://github.com/spence-s/flat-xo/actions/workflows/node.js.yml/badge.svg)](https://github.com/spence-s/flat-xo/actions/workflows/node.js.yml)

# Flat XO

A reimplementation of xo linter (https://github.com/xojs/xo) powered by a single eslint flat config.

## Status

This project is current work-in-progress. It had been previously paused due to performance and compatibility concerns due to the early stages of flat eslint configurations. However, at this time much of that has been smoothed out. ESLint 9 has been released so the completion of this effort is now a priority.

## TODO:

eslint-plugin-import is currently a big blocker. It doesn't work too well at all and this is known. eslint-plugin-import-x is likely to gain flat compatibility before import.


- [ ] Prettier does not work correctly
  - [ ] fix
  - [ ] add tests
- [ ] determine what to do with plugin import
- [ ] ts config resolution is still buggy
- [ ] cli arguments could use some thinking about
- [ ] all plugins should be more thoroughly tested for compatibility

