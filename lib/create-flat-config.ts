/* eslint-disable complexity */
import path from 'node:path';
import pluginAva from 'eslint-plugin-ava';
import pluginUnicorn from 'eslint-plugin-unicorn';
import pluginImport from 'eslint-plugin-import';
import pluginN from 'eslint-plugin-n';
import pluginComments from 'eslint-plugin-eslint-comments';
import pluginNoUseExtendNative from 'eslint-plugin-no-use-extend-native';
import configXoTypescript from 'eslint-config-xo-typescript';
import configXo from 'eslint-config-xo';
import pluginTypescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import pluginPrettier from 'eslint-plugin-prettier';
import configPrettier from 'eslint-config-prettier';
import arrify from 'arrify';
import globals from 'globals';
import prettier from 'prettier';
import pick from 'lodash.pick';
import {
  type FlatESLintConfigItem,
  type FlatESLintConfig,
} from 'eslint-define-config';
import {
  DEFAULT_IGNORES,
  DEFAULT_EXTENSION,
  TYPESCRIPT_EXTENSION,
} from './constants.js';
import {type XoConfigItem} from './types.js';
import {rules, tsRules} from './rules.js';

const ALL_FILES_GLOB = `**/*.{${DEFAULT_EXTENSION.join(',')}}`;

const TS_FILES_GLOB = `**/*.{${TYPESCRIPT_EXTENSION.join(',')}}`;

let cachedPrettierConfig: Record<string, unknown>;

/**
 * Takes a xo flat config and returns an eslint flat config
 */
async function createConfig(
  {
    ignores = [],
    space = false,
    semicolon = false,
    tsconfig = '',
    cwd = '',
  }: XoConfigItem,
  userConfigs?: XoConfigItem[],
): Promise<FlatESLintConfig[]> {
  const baseConfig: FlatESLintConfig[] = [
    {
      ignores: DEFAULT_IGNORES.concat(ignores).filter(Boolean),
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
          ...(globals.es2021 as Record<string, boolean>),
          ...(globals.node as Record<string, boolean>),
        },
        ecmaVersion: configXo.parserOptions?.ecmaVersion,
        sourceType: configXo.parserOptions?.sourceType,
        parserOptions: {
          ...configXo.parserOptions,
        },
      },
      settings: {
        'import/core-modules': ['electron', 'atom'],
        'import/parsers': {
          espree: ['.js', '.cjs', '.mjs', '.jsx'],
        },
        'import/resolver': {
          node: true,
        },
      },
      rules,
    },
    {
      files: [TS_FILES_GLOB],
      rules: tsRules,
    },
    ...(configXoTypescript.overrides?.map<FlatESLintConfigItem>((override) => {
      return {
        files: arrify(override.files),
        ignores: arrify(override.excludedFiles),
        rules: override.rules,
      };
    }) ?? []),
  ].filter(Boolean);

  /**
   * Since configs are merged and the last config takes precedence
   * this means we need to handle both true AND false cases for each option.
   * ie... we need to turn prettier,space,semi,etc... on or off for a specific file
   */
  for (const config of [...arrify(userConfigs), {space, semicolon}]) {
    if (Object.keys(config).length === 0) {
      continue;
    }

    /**
     * Special case
     * string of built in recommended configs
     */
    if (typeof config === 'string') {
      baseConfig.push(config);
      continue;
    }

    /**
     * Special case
     * global ignores
     */
    if (
      Object.keys(config).length === 1 &&
      Object.keys(config)[0] === 'ignores'
    ) {
      baseConfig.push(config);
      continue;
    }

    if (config.files === undefined) {
      config.files = [ALL_FILES_GLOB];
    }

    if (!config.rules) {
      config.rules = {};
    }

    if (!config.semicolon && !config.prettier) {
      config.rules['@typescript-eslint/semi'] = ['error', 'never'];
      config.rules.semi = ['error', 'never'];
      config.rules['semi-spacing'] = [
        'error',
        {
          before: false,
          after: true,
        },
      ];
    }

    if (config.space) {
      const spaces = typeof config.space === 'number' ? config.space : 2;

      config.rules = {
        ...config.rules,
        indent: ['error', spaces, {SwitchCase: 1}],
        '@typescript-eslint/indent': ['error', spaces, {SwitchCase: 1}],
      };
    }

    if (config.prettier) {
      const prettierOptions =
        cachedPrettierConfig ??
        // eslint-disable-next-line no-await-in-loop
        (await prettier.resolveConfig(cwd, {editorconfig: true})) ??
        {};

      // Only look up prettier once per run
      cachedPrettierConfig = prettierOptions;

      if (
        (config.semicolon && prettierOptions['semi'] === false) ??
        (!config.semicolon && prettierOptions['semi'] === true)
      ) {
        throw new Error(
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          `The Prettier config \`semi\` is ${prettierOptions['semi']} while XO \`semicolon\` is ${config.semicolon}`,
        );
      }

      if (
        ((config.space ?? typeof config.space === 'number') &&
          prettierOptions['useTabs'] === true) ||
        (!config.space && prettierOptions['useTabs'] === false)
      ) {
        throw new Error(
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          `The Prettier config \`useTabs\` is ${prettierOptions['useTabs']} while XO \`space\` is ${config.space}`,
        );
      }

      if (
        typeof config.space === 'number' &&
        typeof prettierOptions['tabWidth'] === 'number' &&
        config.space !== prettierOptions['tabWidth']
      ) {
        throw new Error(
          `The Prettier config \`tabWidth\` is ${prettierOptions['tabWidth']} while XO \`space\` is ${config.space}`,
        );
      }

      config.plugins = {
        ...config.plugins,
        prettier: pluginPrettier,
      };

      config.rules = {
        ...config.rules,
        ...pluginPrettier.configs?.['recommended']?.rules,
        'prettier/prettier': [
          'error',
          {
            singleQuote: true,
            bracketSpacing: false,
            bracketSameLine: false,
            trailingComma: 'all',
            tabWidth: typeof config.space === 'number' ? config.space : 2,
            useTabs: !config.space,
            semi: config.semicolon,
            ...prettierOptions,
          },
        ],
        ...configPrettier.rules,
      };
    }

    baseConfig.push(
      pick(config, [
        'files',
        'ignores',
        'languageOptions',
        'plugins',
        'settings',
        'rules',
      ]),
    );
  }

  // Esnure all ts files are parsed with the ts parser so this is added last
  // this makes it easy to add '@typescript-eslint/*' rules anywhere with no worries
  // helps everything to load these last
  baseConfig.push({
    files: [TS_FILES_GLOB],
    plugins: {
      '@typescript-eslint': {
        ...pluginTypescript,
        // https://github.com/eslint/eslint/issues/16875
        // see note above on the parser object in languageOptions
        // @ts-expect-error this is a hack
        parsers: {
          parser: typescriptParser,
        },
      },
    },
    languageOptions: {
      // https://github.com/eslint/eslint/issues/16875
      // this should be changing soon to allow the parser object to be added here
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ...configXoTypescript.parserOptions,
        project: path.resolve(cwd, tsconfig ?? 'tsconfig.json'),
      },
    },
    settings: {
      'import/resolver': {
        typescript: true,
      },
      '@typescript-eslint/parser': ['.ts', '.cts', '.mts', '.tsx'],
    },
  });

  return baseConfig;
}

export default createConfig;
