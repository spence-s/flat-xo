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
import pluginPrettier from 'eslint-plugin-prettier';
import configPrettier from 'eslint-config-prettier';
import arrify from 'arrify';
import globals from 'globals';
// eslint-disable-next-line import-x/no-named-default
import {default as prettier} from 'prettier';
import pick from 'lodash.pick';
import {type FlatESLintConfig} from 'eslint-define-config';
import {type ESLint} from 'eslint';
import {
  DEFAULT_IGNORES,
  TS_EXTENSIONS,
  TS_FILES_GLOB,
  ALL_FILES_GLOB,
  JS_EXTENSIONS,
  ALL_EXTENSIONS,
} from './constants.js';
import {type XoConfigItem} from './types.js';
import {jsRules, tsRules, baseRules} from './rules.js';

let cachedPrettierConfig: Record<string, unknown>;

/**
 * Takes a xo flat config and returns an eslint flat config
 */
async function createConfig(userConfigs?: XoConfigItem[]): Promise<FlatESLintConfig[]> {
  // The default global options
  let _prettier;
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
  for (const userConfig of userConfigs ?? []) {
    if (Object.keys(userConfig).length === 0) {
      continue;
    }

    /**
     * Special case
     * string of built in recommended configs
     */
    if (typeof userConfig === 'string') {
      baseConfig.push(userConfig);
      continue;
    }

    /**
     * Special case
     * global ignores
     */
    if (
      Object.keys(userConfig).length === 1
      && Object.keys(userConfig)[0] === 'ignores'
    ) {
      // Accept ignores as a string or array of strings for user convenience
      userConfig.ignores = arrify(userConfig.ignores);
      baseConfig.push(userConfig);
      continue;
    }

    // ensure files is valid
    userConfig.files ||= [ALL_FILES_GLOB];
    userConfig.files = arrify(userConfig.files);

    // Set up a default rules object to potentially add to if needed
    userConfig.rules ||= userConfig.rules ?? {};

    if (userConfig.semicolon === false) {
      userConfig.rules['@stylistic/semi'] = ['error', 'never'];
      userConfig.rules['@stylistic/semi-spacing'] = [
        'error',
        {
          before: false,
          after: true,
        },
      ];
    }

    if (userConfig.space) {
      const spaces = typeof userConfig.space === 'number' ? userConfig.space : 2;

      userConfig.rules = {
        ...userConfig.rules,
        '@stylistic/indent': ['error', spaces, {SwitchCase: 1}],
      };
    } else if (userConfig.space === false) {
      // If a user set this false for a small subset of files for some reason,
      // then we need to set them back to their original values
      userConfig.rules = {
        ...userConfig.rules,
        '@stylistic/indent': configXoTypescript[0]?.rules?.indent,
      };
    }

    if (userConfig.prettier) {
      const prettierOptions
        = cachedPrettierConfig
        // eslint-disable-next-line no-await-in-loop
        ?? (await prettier.resolveConfig(cwd, {editorconfig: true}))
        ?? {};

      // Only look up prettier once per run
      cachedPrettierConfig = prettierOptions;

      if (
        (userConfig.semicolon && prettierOptions['semi'] === false)
        ?? (!userConfig.semicolon && prettierOptions['semi'] === true)
      ) {
        throw new Error(`The Prettier config \`semi\` is ${prettierOptions['semi']} while XO \`semicolon\` is ${userConfig.semicolon}`);
      }

      if (
        ((userConfig.space ?? typeof userConfig.space === 'number')
        && prettierOptions['useTabs'] === true)
        || (!userConfig.space && prettierOptions['useTabs'] === false)
      ) {
        throw new Error(`The Prettier config \`useTabs\` is ${prettierOptions['useTabs']} while XO \`space\` is ${userConfig.space}`);
      }

      if (
        typeof userConfig.space === 'number'
        && typeof prettierOptions['tabWidth'] === 'number'
        && userConfig.space !== prettierOptions['tabWidth']
      ) {
        throw new Error(`The Prettier config \`tabWidth\` is ${prettierOptions['tabWidth']} while XO \`space\` is ${userConfig.space}`);
      }

      userConfig.plugins = {
        ...userConfig.plugins,
        prettier: pluginPrettier,
      };

      userConfig.rules = {
        ...userConfig.rules,
        ...(pluginPrettier.configs?.['recommended'] as ESLint.ConfigData)
          ?.rules,
        'prettier/prettier': [
          'error',
          {
            singleQuote: true,
            bracketSpacing: false,
            bracketSameLine: false,
            trailingComma: 'all',
            tabWidth:
              typeof userConfig.space === 'number' ? userConfig.space : 2,
            useTabs: !userConfig.space,
            semi: userConfig.semicolon,
            ...prettierOptions,
          },
        ],
        ...configPrettier.rules,
      };
    } else if (_prettier === false) {
      // Turn prettier off for a subset of files
      userConfig.rules = {
        ...userConfig.rules,
        'prettier/prettier': 'off',
      };
    }

    const options = [
      'files',
      'ignores',
      'languageOptions',
      'plugins',
      'settings',
      'rules',
    ];

    baseConfig.push(pick(userConfig, options));
  }

  return baseConfig;
}

export default createConfig;
