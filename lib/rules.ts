import configXo from 'eslint-config-xo';
import pluginAva from 'eslint-plugin-ava';
import pluginUnicorn from 'eslint-plugin-unicorn';
import configXoTypescript from 'eslint-config-xo-typescript';
import {type Rules} from 'eslint-define-config';
import conf from '../config/plugins.js';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const baseRules: Rules = {
  // @ts-expect-error This definitely exists in this case - no worth fixing types
  ...pluginAva.configs?.recommended?.rules,
  // @ts-expect-error This definitely exists in this case - not worth fixing types
  ...pluginUnicorn.configs?.recommended?.rules,
  ...conf.rules,
};

// @ts-expect-error This definitely exists in this case - no worth fixing types
export const jsRules: Rules = {
  ...configXo.rules,
  'capitalized-comments': 'off',
};

// @ts-expect-error This definitely exists in this case - no worth fixing types
const customTsRules: Rules = {
  'unicorn/import-style': 'off',
  'n/file-extension-in-import': 'off',
  // Disabled because of https://github.com/benmosher/eslint-plugin-import-x/issues/1590
  'import-x/export': 'off',
  // Does not work when the TS definition exports a default const.
  'import-x/default': 'off',
  // Disabled as it doesn't work with TypeScript.
  // This issue and some others: https://github.com/benmosher/eslint-plugin-import-x/issues/1341
  'import-x/named': 'off',
};

// @ts-expect-error This definitely exists in this case - no worth fixing types
export const tsRules: Rules = {
  ...configXoTypescript.rules,
  ...customTsRules,
};
