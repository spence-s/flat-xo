<h1 align="center">
	<br>
	<img width="400" src="media/logo.svg" alt="XO">
	<br>
	<br>
	<br>
</h1>

> JavaScript/TypeScript linter (ESLint wrapper) with great defaults

[![Coverage Status](https://codecov.io/gh/xojs/xo/branch/main/graph/badge.svg)](https://codecov.io/gh/xojs/xo/branch/main)
[![XO code style](https://shields.io/badge/code_style-5ed9c7?logo=xo&labelColor=gray&logoSize=auto&logoWidth=20)](https://github.com/xojs/xo)

Opinionated but configurable ESLint wrapper with lots of goodies included. Enforces strict and readable code. Never discuss code style on a pull request again! No decision-making. No `.eslintrc` or `eslint.config.js` to manage. It just works!

It uses [ESLint](https://eslint.org) underneath, so issues regarding built-in rules should be opened over [there](https://github.com/eslint/eslint/issues).

**XO requires your project to be [ESM](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).**

![](https://raw.githubusercontent.com/sindresorhus/eslint-formatter-pretty/main/screenshot.png)

## Highlights

- Beautiful output.
- Zero-config, but [configurable when needed](#config).
- Enforces readable code, because you read more code than you write.
- No need to specify file paths to lint as it lints all JS/TS files except for [commonly ignored paths](#ignores).
- [Flat config customization.](#config-overrides)
- [TypeScript supported by default.](#typescript)
- Includes many useful ESLint plugins, like [`unicorn`](https://github.com/sindresorhus/eslint-plugin-unicorn), [`import`](https://github.com/benmosher/eslint-plugin-import), [`ava`](https://github.com/avajs/eslint-plugin-ava), [`n`](https://github.com/eslint-community/eslint-plugin-n) and more.
- Automatically enables rules based on the [`engines`](https://docs.npmjs.com/files/package.json#engines) field in your `package.json`.
- Caches results between runs for much better performance.
- Super simple to add XO to a project with [`$ npm init xo`](https://github.com/xojs/create-xo).
- Fix many issues automagically with `$ xo --fix`.
- Open all files with errors at the correct line in your editor with `$ xo --open`.
- Specify [indent](#space) and [semicolon](#semicolon) preferences easily without messing with the rule config.
- Optionally use the [Prettier](https://github.com/prettier/prettier) code style or turn off all prettier rules with the 'compat' option.
- Optionally use `eslint-config-xo-react` for easy jsx and react linting with zero config.
- Great [editor plugins](#editor-plugins).

## Install

```sh
npm install xo --save-dev
```

_You must install XO locally. You can run it directly with `$ npx xo`._

_You'll need [eslint-config-xo-vue](https://github.com/ChocPanda/eslint-config-xo-vue#use-with-xo) for specific linting in a Vue app._

## Usage

```
$ xo --help

	Usage
		$ xo [<file|glob> ...]

	Options
		--fix             Automagically fix issues
		--ignore          Additional paths to ignore  [Can be set multiple times]
		--space           Use space indent instead of tabs  [Default: 2]
		--no-semicolon    Prevent use of semicolons
		--prettier        Conform to Prettier code style or turn off conflicting rules
		--react           Add react plugins and the xo-react config
		--quiet           Show only errors and no warnings
		--cwd=<dir>       Working directory for files
		--stdin           Validate/fix code from stdin
		--stdin-filename  Specify a filename for the --stdin option
		--print-config    Print the ESLint configuration for the given file

	Examples
		$ xo
		$ xo index.js
		$ xo *.js !foo.js
		$ xo --space
		$ xo --print-config=index.js
		$ echo 'const x=true' | xo --stdin --fix
```

## Default code style

_Any of these can be [overridden](#rules) if necessary._

- Tab indentation _[(or space)](#space)_
- Semicolons _[(or not)](#semicolon)_
- Single-quotes
- [Trailing comma](https://medium.com/@nikgraf/why-you-should-enforce-dangling-commas-for-multiline-statements-d034c98e36f8) for multiline statements
- No unused variables
- Space after keyword `if (condition) {}`
- Always `===` instead of `==`

Check out an [example](index.js) and the [ESLint rules](https://github.com/xojs/eslint-config-xo/blob/main/index.js).

## Workflow

The recommended workflow is to add XO locally to your project and run it with the tests.

Simply run `$ npm init xo` (with any options) to add XO to create an `xo.config.js`.

## Config

You can configure XO options by creating an `xo.config.js` or an `xo.config.ts` file in the root directory of your project. XO's config is an extension of ESLints Flat Config. Like ESLint, an XO config exports an array of XO config objects. XO config objects extend [ESLint Configuration Objects](https://eslint.org/docs/latest/use/configure/configuration-files#configuration-objects). This means all the available configuration params for ESLint also work for `XO`. However, `XO` enhances and adds extra params to the configuration objects to make them easier to work with.

### files

type: `string | string[] | undefined`,
default: `**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}`;

A glob or array of glob strings which the config object will apply. By default `XO` will apply the configuration to [all files](lib/constants.ts).

### ignores

Type: `string[]`

Some [paths](lib/constants.ts) are ignored by default, including paths in `.gitignore`. Additional ignores can be added here. For global ignores,

### space

Type: `boolean | number`\
Default: `false` _(tab indentation)_

Set it to `true` to get 2-space indentation or specify the number of spaces.

This option exists for pragmatic reasons, but I would strongly recommend you read ["Why tabs are superior"](http://lea.verou.me/2012/01/why-tabs-are-clearly-superior/).

### semicolon

Type: `boolean`\
Default: `true` _(Semicolons required)_

Set it to `false` to enforce no-semicolon style.

### prettier

Type: `boolean|'compat'`\
Default: `false`

Format code with [Prettier](https://github.com/prettier/prettier).

[Prettier options](https://prettier.io/docs/en/options.html) will be based on your [Prettier config](https://prettier.io/docs/en/configuration.html). XO will then **merge** your options with its own defaults:

- [semi](https://prettier.io/docs/en/options.html#semicolons): based on [semicolon](#semicolon) option
- [useTabs](https://prettier.io/docs/en/options.html#tabs): based on [space](#space) option
- [tabWidth](https://prettier.io/docs/en/options.html#tab-width): based on [space](#space) option
- [trailingComma](https://prettier.io/docs/en/options.html#trailing-commas): `all`
- [singleQuote](https://prettier.io/docs/en/options.html#quotes): `true`
- [bracketSpacing](https://prettier.io/docs/en/options.html#bracket-spacing): `false`

To stick with Prettier's defaults, add this to your Prettier config:

```js
export default {
	trailingComma: "es5",
	singleQuote: false,
	bracketSpacing: true,
};
```

If contradicting options are set for both Prettier and XO, an error will be thrown.

#### prettier compat

If the prettier option is set to "compat", instead of formatting your code automatically, xo will turn off all rules that conflict with prettier code style and allow you to pass your formatting to the prettier tool directly.

### react

Type: `boolean`\
Default: `false`

Adds eslint-config-plugin-react, eslint-plugin-react-hooks and eslint-config-xo-react to get all the react best practices applied automatically

## Tips

### The --ts option

By default, `XO` will handle all aspects of [type aware linting](https://typescript-eslint.io/getting-started/typed-linting/), even when a file is not included in a tsconfig, which would normally error when using ESLint directly. However, this incurs a small performance penalty of having to look up the tsconfig each time in order to calculate and write an appropriate default tsconfig to use for the file. In situations where you are linting often, you may want to configure your project [correctly for type aware linting](https://typescript-eslint.io/getting-started/typed-linting/). This can help performance in editor plugins.

### Monorepo

Put a `xo.config.js` with your config at the root and do not add a config to any of your bundled packages.

### Including files ignored by default

To include files that XO [ignores by default](lib/constants.js#L1), add them as negative globs in the `ignores` option:

```js
const xoConfig = [{ ignores: ["!vendor/**"] }];
export default xoConfig;
```

## FAQ

#### What does XO mean?

It means [hugs and kisses](https://en.wiktionary.org/wiki/xoxo).

#### Why not Standard?

The [Standard style](https://standardjs.com) is a really cool idea. I too wish we could have one style to rule them all! But the reality is that the JS community is just too diverse and opinionated to create _one_ code style. They also made the mistake of pushing their own style instead of the most popular one. In contrast, XO is more pragmatic and has no aspiration of being _the_ style. My goal with XO is to make it simple to enforce consistent code style with close to no config. XO comes with my code style preference by default, as I mainly made it for myself, but everything is configurable.

#### Why not ESLint?

XO is based on ESLint. This project started out as just a shareable ESLint config, but it quickly grew out of that. I wanted something even simpler. Just typing `xo` and be done. No decision-making. No config. I also have some exciting future plans for it. However, you can still get most of the XO benefits while using ESLint directly with the [ESLint shareable config](https://github.com/xojs/eslint-config-xo).

## Editor plugins

- [Sublime Text](https://github.com/xojs/SublimeLinter-contrib-xo)
- [Atom](https://github.com/xojs/atom-linter-xo)
- [Vim](https://github.com/xojs/vim-xo)
- [TextMate 2](https://github.com/claylo/XO.tmbundle)
- [VSCode](https://github.com/SamVerschueren/vscode-linter-xo)
- [Emacs](https://github.com/j-em/xo-emacs)
- [WebStorm](https://github.com/jamestalmage/xo-with-webstorm)

## Build-system plugins

- [Gulp](https://github.com/xojs/gulp-xo)
- [Grunt](https://github.com/xojs/grunt-xo)
- [webpack loader](https://github.com/Semigradsky/xo-loader)
- [webpack plugin](https://github.com/nstanard/xo-webpack-plugin)
- [Metalsmith](https://github.com/blainsmith/metalsmith-xo)
- [Fly](https://github.com/lukeed/fly-xo)

## Configs

- [eslint-config-xo](https://github.com/xojs/eslint-config-xo) - ESLint shareable config for XO with tab indent
- [eslint-config-xo-space](https://github.com/xojs/eslint-config-xo-space) - ESLint shareable config for XO with 2-space indent
- [eslint-config-xo-react](https://github.com/xojs/eslint-config-xo-react) - ESLint shareable config for React to be used with the above
- [eslint-config-xo-vue](https://github.com/ChocPanda/eslint-config-xo-vue) - ESLint shareable config for Vue to be used with the above
- [stylelint-config-xo](https://github.com/xojs/stylelint-config-xo) - Stylelint shareable config for XO with tab indent
- [stylelint-config-xo-space](https://github.com/xojs/stylelint-config-xo-space) - Stylelint shareable config for XO with 2-space indent
- [eslint-config-xo-typescript](https://github.com/xojs/eslint-config-xo-typescript) - ESLint shareable config for TypeScript

## Support

- [Twitter](https://twitter.com/sindresorhus)

## Related

- [eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn) - Various awesome ESLint rules _(Bundled in XO)_
- [xo-summary](https://github.com/LitoMore/xo-summary) - Display output from `xo` as a list of style errors, ordered by count

## Badge

Show the world you're using XO → [![XO code style](https://shields.io/badge/code_style-5ed9c7?logo=xo&labelColor=gray&logoSize=auto&logoWidth=20)](https://github.com/xojs/xo)

```md
[![XO code style](https://shields.io/badge/code_style-5ed9c7?logo=xo&labelColor=gray&logoSize=auto&logoWidth=20)](https://github.com/xojs/xo)
```

Or [customize the badge](https://github.com/xojs/xo/issues/689#issuecomment-1253127616).

You can also find some nice dynamic XO badges on [badgen.net](https://badgen.net/#xo).

## Team

- [Sindre Sorhus](https://github.com/sindresorhus)

###### Former

- [James Talmage](https://github.com/jamestalmage)
- [Michael Mayer](https://github.com/schnittstabil)
- [Mario Nebl](https://github.com/marionebl)
- [Pierre Vanduynslager](https://github.com/pvdlg)
