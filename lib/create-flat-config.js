/* eslint-disable complexity */
/** eslint-disable complexity */
import pluginAva from 'eslint-plugin-ava';
import pluginUnicorn from 'eslint-plugin-unicorn';
import pluginImport from 'eslint-plugin-import';
import pluginN from 'eslint-plugin-n';
import semver from 'semver';
import pluginComments from 'eslint-plugin-eslint-comments';
import pluginNoUseExtendNative from 'eslint-plugin-no-use-extend-native';
import configXoTypescript from 'eslint-config-xo-typescript';
import pluginTypescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import pluginPrettier from 'eslint-plugin-prettier';
import configPrettier from 'eslint-config-prettier';
import globals from 'globals';
import prettier from 'prettier';
import {rules, tsRules} from './rules.js';
import {ENGINE_RULES, DEFAULT_IGNORES} from './constants.js';

const ALL_FILES_GLOB = '**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}';
const TS_FILES_GLOB = '**/*.{ts,tsx,mts,cts}';
// const JS_FILES_GLOB = '**/*.{js,jsx,jts,jts/}';

const tsPlugins = {
  '@typescript-eslint': {
    ...pluginTypescript,
    // see note below on the parser object in languageOptions
    parsers: {
      parser: typescriptParser,
    },
  },
};
const tsLanguageOptions = {
  // https://github.com/eslint/eslint/issues/16875
  // this should be changing soon to allow the parser object to be added here
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './jsconfig.json',
  },
};

/** @typedef {import('eslint-define-config').FlatESLintConfig[]} FlatESLintConfigs */

/**
 * Takes a xo flat config and returns an eslint flat config
 *
 * @param {XO.FlatConfig[]} userConfigs
 * @returns {Promise<FlatESLintConfigs>}
 */
async function createConfig(userConfigs = []) {
  /** @type {FlatESLintConfigs} */
  const baseConfig = [
    {
      ignores: DEFAULT_IGNORES,
    },
    {
      files: [ALL_FILES_GLOB],
      plugins: {
        'no-use-extend-native': pluginNoUseExtendNative,
        ava: pluginAva,
        unicorn: pluginUnicorn,
        import: pluginImport,
        n: pluginN,
        'eslint-comments': pluginComments,
      },
      languageOptions: {
        globals: {
          ...globals.es2021,
          ...globals.node,
        },
        ecmaVersion: 'latest',
        sourceType: 'module',
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
        },
      },
      settings: {
        'import/core-modules': ['electron', 'atom'],
        'import/parsers': {
          espree: ['.js', '.cjs', '.mjs', '.jsx'],
        },
      },
      // @ts-ignore
      rules,
    },
    {
      files: [TS_FILES_GLOB],
      plugins: tsPlugins,
      languageOptions: tsLanguageOptions,
      // @ts-ignore
      rules: tsRules,
    },
    // @ts-ignore
    ...configXoTypescript.overrides,
  ];

  for (const config of userConfigs) {
    if (typeof config === 'string') {
      baseConfig.push(config);
      continue;
    }

    if (config.files === undefined) {
      config.files = [ALL_FILES_GLOB];
    }

    if (!config.rules) config.rules = {};

    for (const [rule, ruleConfig] of Object.entries(ENGINE_RULES)) {
      for (const minVersion of Object.keys(ruleConfig).sort(semver.rcompare)) {
        if (
          !config.nodeVersion ||
          (typeof config.nodeVersion === 'string' &&
            semver.intersects(config.nodeVersion, `<${minVersion}`))
        ) {
          config.rules[rule] = ruleConfig[minVersion];
        }
      }
    }

    if (config.nodeVersion && typeof config.nodeVersion === 'string') {
      config.rules['n/no-unsupported-features/es-builtins'] = [
        'error',
        {version: config.nodeVersion},
      ];
      config.rules['n/no-unsupported-features/es-syntax'] = [
        'error',
        {version: config.nodeVersion, ignores: ['modules']},
      ];
      config.rules['n/no-unsupported-features/node-builtins'] = [
        'error',
        {version: config.nodeVersion},
      ];
    }

    if (config.space) {
      const spaces = typeof config.space === 'number' ? config.space : 2;

      config.rules = {
        ...config.rules,
        indent: ['error', spaces, {SwitchCase: 1}],
      };

      // TODO: we need to do a glob match here to make this correct
      // we just need to prove that it works first
      // for ts
      baseConfig.push({
        files: config.files ?? TS_FILES_GLOB,
        plugins: tsPlugins,
        languageOptions: tsLanguageOptions,
        rules: {
          '@typescript-eslint/indent': ['error', spaces, {SwitchCase: 1}],
        },
      });
    }

    if (config.prettier) {
      const prettierOptions =
        // eslint-disable-next-line no-await-in-loop, n/prefer-global/process
        (await prettier.resolveConfig(process.cwd(), {
          editorconfig: true,
        })) || {};

      if (
        (config.semicolon === true && prettierOptions.semi === false) ||
        (config.semicolon === false && prettierOptions.semi === true)
      ) {
        throw new Error(
          `The Prettier config \`semi\` is ${prettierOptions.semi} while XO \`semicolon\` is ${config.semicolon}`,
        );
      }

      if (
        ((config.space === true || typeof config.space === 'number') &&
          prettierOptions.useTabs === true) ||
        (config.space === false && prettierOptions.useTabs === false)
      ) {
        throw new Error(
          `The Prettier config \`useTabs\` is ${prettierOptions.useTabs} while XO \`space\` is ${config.space}`,
        );
      }

      if (
        typeof config.space === 'number' &&
        typeof prettierOptions.tabWidth === 'number' &&
        config.space !== prettierOptions.tabWidth
      ) {
        throw new Error(
          `The Prettier config \`tabWidth\` is ${prettierOptions.tabWidth} while XO \`space\` is ${config.space}`,
        );
      }

      // @ts-ignore
      config.plugins = {
        ...config.plugins,
        prettier: pluginPrettier,
      };

      config.rules = {
        ...config.rules,
        ...pluginPrettier.configs.recommended.rules,
        'prettier/prettier': [
          'error',
          {
            singleQuote: true,
            bracketSpacing: false,
            bracketSameLine: false,
            trailingComma: 'all',
            tabWidth: typeof config.space === 'number' ? config.space : 2,
            useTabs: !config.space,
            semi: config.semicolon !== false,
            ...prettierOptions,
          },
        ],
        ...configPrettier.rules,
      };
    }

    delete config.space;
    delete config.prettier;

    baseConfig.push(config);
  }

  return baseConfig;
}

export default createConfig;
