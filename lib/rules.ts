import configXo from 'eslint-config-xo';
import pluginAva from 'eslint-plugin-ava';
import pluginUnicorn from 'eslint-plugin-unicorn';
import configXoTypescript from 'eslint-config-xo-typescript';
import type {Rules} from 'eslint-define-config';
import conf from '../config/plugins.js';

export const baseRules: Rules = {
	...pluginAva.configs?.['recommended']?.rules,
	...pluginUnicorn.configs?.['recommended']?.rules,
	...conf.rules,
};

export const jsRules: Rules = {
	...configXo.rules,
};

const customTsRules: Rules = {
	'unicorn/import-style': 'off',
	'n/file-extension-in-import': 'off',
	// Disabled because of https://github.com/benmosher/eslint-plugin-import/issues/1590
	'import/export': 'off',
	// Does not work when the TS definition exports a default const.
	'import/default': 'off',
	// Disabled as it doesn't work with TypeScript.
	// This issue and some others: https://github.com/benmosher/eslint-plugin-import/issues/1341
	'import/named': 'off',
	'import/extensions': 'off',
	'@typescript-eslint/naming-convention': 'off',
};

export const tsRules: Rules = {
	...configXoTypescript.rules,
	...customTsRules,
};
