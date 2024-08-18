
import pluginAva from 'eslint-plugin-ava';
import pluginUnicorn from 'eslint-plugin-unicorn';
import pluginImport from 'eslint-plugin-import-x';
import pluginN from 'eslint-plugin-n';
import pluginComments from '@eslint-community/eslint-plugin-eslint-comments';
import pluginPromise from 'eslint-plugin-promise';
import pluginNoUseExtendNative from 'eslint-plugin-no-use-extend-native';
import configXoTypescript from 'eslint-config-xo-typescript';
import stylisticPlugin from '@stylistic/eslint-plugin';
import globals from 'globals';
import {type Linter} from 'eslint';
import {
  DEFAULT_IGNORES,
  TS_EXTENSIONS,
  TS_FILES_GLOB,
  ALL_FILES_GLOB,
  JS_EXTENSIONS,
  ALL_EXTENSIONS,
} from '../constants.js';
import {jsRules, tsRules, baseRules} from '../rules.js';

export const xoPluginsConfig: Linter.Config[] = [
  {
    ignores: DEFAULT_IGNORES,
  },
  {
    files: [ALL_FILES_GLOB],
    plugins: {
      'no-use-extend-native': pluginNoUseExtendNative,
      ava: pluginAva,
      unicorn: pluginUnicorn,
      'import-x': pluginImport,
      n: pluginN,
      '@eslint-community/eslint-comments': pluginComments,
      promise: pluginPromise,
      '@stylistic': stylisticPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.es2021,
        ...globals.node,
      },
      ecmaVersion: configXoTypescript[0]?.languageOptions?.ecmaVersion,
      sourceType: configXoTypescript[0]?.languageOptions?.sourceType,
      parserOptions: {
        ...configXoTypescript[0]?.languageOptions?.parserOptions,
      },
    },
    settings: {
      'import-x/extensions': ALL_EXTENSIONS,
      'import-x/core-modules': ['electron', 'atom'],
      'import-x/parsers': {
        espree: JS_EXTENSIONS,
        '@typescript-eslint/parser': TS_EXTENSIONS,
      },
      'import-x/external-module-folders': [
        'node_modules',
        'node_modules/@types',
      ],
      'import-x/resolver': {
        node: ALL_EXTENSIONS,
      },
    },
    /**
     * These are the base rules that are always applied to all js and ts file types
     */
    rules: {...baseRules, ...jsRules},
  },
  {
    plugins: configXoTypescript[1]?.plugins,
    files: [TS_FILES_GLOB],
    languageOptions: configXoTypescript[1]?.languageOptions,
    /** This turns on rules in typescript-eslint and turns off rules from eslint that conflict */
    rules: tsRules,
  },
  ...configXoTypescript.slice(2),
];
