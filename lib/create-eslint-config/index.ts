/* eslint-disable complexity */
import pluginAva from 'eslint-plugin-ava';
import pluginUnicorn from 'eslint-plugin-unicorn';
import pluginImport from 'eslint-plugin-import-x';
import pluginN from 'eslint-plugin-n';
import pluginComments from '@eslint-community/eslint-plugin-eslint-comments';
import pluginPromise from 'eslint-plugin-promise';
import pluginNoUseExtendNative from 'eslint-plugin-no-use-extend-native';
import configXoTypescript from 'eslint-config-xo-typescript';
import stylisticPlugin from '@stylistic/eslint-plugin';
import arrify from 'arrify';
import globals from 'globals';
import {type FlatESLintConfig} from 'eslint-define-config';
import {
  DEFAULT_IGNORES,
  TS_EXTENSIONS,
  TS_FILES_GLOB,
  ALL_FILES_GLOB,
  JS_EXTENSIONS,
  ALL_EXTENSIONS,
} from '../constants.js';
import {type XoConfigItem} from '../types.js';
import {jsRules, tsRules, baseRules} from '../rules.js';
import {xoToEslintConfigItem} from './xo-to-eslint-config-item.js';
import {handlePrettierOptions} from './handle-prettier-options.js';

/**
 * Takes a xo flat config and returns an eslint flat config
 */
async function createConfig(userConfigs?: XoConfigItem[]): Promise<FlatESLintConfig[]> {
  const cwd = '';

  const baseConfig: FlatESLintConfig[] = [
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

  /**
   * Since configs are merged and the last config takes precedence
   * this means we need to handle both true AND false cases for each option.
   * ie... we need to turn prettier,space,semi,etc... on or off for a specific file
   */
  for (const xoUserConfig of userConfigs ?? []) {
    const keysOfXoConfig = Object.keys(xoUserConfig);

    if (keysOfXoConfig.length === 0) {
      continue;
    }

    /**
     * Special case
     * global ignores
    */
    if (
      keysOfXoConfig.length === 1
      && keysOfXoConfig[0] === 'ignores'
    ) {
      baseConfig.push({ignores: arrify(xoUserConfig.ignores)});
      continue;
    }

    // An eslint config item with rules and files initialized
    const eslintConfigItem = xoToEslintConfigItem(xoUserConfig);

    if (xoUserConfig.semicolon === false) {
      eslintConfigItem.rules['@stylistic/semi'] = ['error', 'never'];
      eslintConfigItem.rules['@stylistic/semi-spacing'] = [
        'error',
        {
          before: false,
          after: true,
        },
      ];
    }

    if (xoUserConfig.space) {
      const spaces = typeof xoUserConfig.space === 'number' ? xoUserConfig.space : 2;
      eslintConfigItem.rules['@stylistic/indent'] = ['error', spaces, {SwitchCase: 1}];
    } else if (xoUserConfig.space === false) {
      // If a user set this false for a small subset of files for some reason,
      // then we need to set them back to their original values
      eslintConfigItem.rules['@stylistic/indent'] = configXoTypescript[1]?.rules?.['@stylistic/indent'];
    }

    if (xoUserConfig.prettier) {
      // eslint-disable-next-line no-await-in-loop
      await handlePrettierOptions(cwd, xoUserConfig, eslintConfigItem);
    } else if (xoUserConfig.prettier === false) {
      // Turn prettier off for a subset of files
      eslintConfigItem.rules['prettier/prettier'] = 'off';
    }

    baseConfig.push(eslintConfigItem);
  }

  return baseConfig;
}

export default createConfig;
