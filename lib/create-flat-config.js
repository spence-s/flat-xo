import configXo from 'eslint-config-xo';
import configXoSpace from 'eslint-config-xo-space';
import pluginAva from 'eslint-plugin-ava';
import pluginUnicorn from 'eslint-plugin-unicorn';
import pluginImport from 'eslint-plugin-import';
import pluginN from 'eslint-plugin-n';
import pluginComments from 'eslint-plugin-eslint-comments';
import pluginNoUseExtendNative from 'eslint-plugin-no-use-extend-native';
import configXoTypescript from 'eslint-config-xo-typescript';
import pluginTypescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import pluginPrettier from 'eslint-plugin-prettier';

const ALL_FILES_GLOB = '**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}';
const TS_FILES_GLOB = '**/*.{ts,tsx,mts,cts}';

/**
 * Takes a xo flat config and returns an eslint flat config
 */
function createConfig(userConfigs) {
  const baseConfig = [
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
      rules: {
        ...pluginAva.configs.recommended.rules,
        ...pluginUnicorn.configs.recommended.rules,
        ...configXo.rules,
        'no-use-extend-native/no-use-extend-native': 'error',
        'unicorn/better-regex': [
          'error',
          {
            sortCharacterClasses: false,
          },
        ],
        'unicorn/consistent-destructuring': 'off',
        'unicorn/no-null': 'off',
        'unicorn/prefer-ternary': ['error', 'only-single-line'],
        'unicorn/prefer-json-parse-buffer': 'off',
        'unicorn/consistent-function-scoping': 'off',
        'unicorn/no-useless-undefined': 'off',
        'function-call-argument-newline': 'off',
        'import/default': 'error',
        'import/export': 'error',
        'import/extensions': [
          'error',
          'always',
          {
            ignorePackages: true,
          },
        ],
        'import/first': 'error',
        'import/named': 'error',
        'import/namespace': [
          'error',
          {
            allowComputed: true,
          },
        ],
        'import/no-absolute-path': 'error',
        'import/no-anonymous-default-export': 'error',
        'import/no-named-default': 'error',
        'import/no-webpack-loader-syntax': 'error',
        'import/no-self-import': 'error',
        'import/no-cycle': [
          'error',
          {
            ignoreExternal: true,
          },
        ],
        'import/no-useless-path-segments': 'error',
        'import/newline-after-import': 'error',
        'import/no-amd': 'error',
        'import/no-duplicates': 'error',
        'import/no-extraneous-dependencies': 'error',
        'import/no-mutable-exports': 'error',
        'import/no-named-as-default-member': 'error',
        'import/no-named-as-default': 'error',
        'import/order': 'error',
        'import/no-unassigned-import': [
          'error',
          {
            allow: [
              '@babel/polyfill',
              '**/register',
              '**/register.*',
              '**/register/**',
              '**/register/**.*',
              '**/*.css',
              '**/*.scss',
              '**/*.sass',
              '**/*.less',
            ],
          },
        ],
        'n/no-unpublished-bin': 'error',
        'n/file-extension-in-import': [
          'error',
          'always',
          {
            '.ts': 'never',
            '.tsx': 'never',
          },
        ],
        'n/no-mixed-requires': [
          'error',
          {
            grouping: true,
            allowCall: true,
          },
        ],
        'n/no-new-require': 'error',
        'n/no-path-concat': 'error',
        'n/process-exit-as-throw': 'error',
        'n/no-deprecated-api': 'error',
        'n/prefer-global/buffer': ['error', 'never'],
        'n/prefer-global/console': ['error', 'always'],
        'n/prefer-global/process': ['error', 'never'],
        'n/prefer-global/text-decoder': ['error', 'always'],
        'n/prefer-global/text-encoder': ['error', 'always'],
        'n/prefer-global/url-search-params': ['error', 'always'],
        'n/prefer-global/url': ['error', 'always'],
        'n/prefer-promises/dns': 'error',
        'n/prefer-promises/fs': 'error',
        'eslint-comments/disable-enable-pair': [
          'error',
          {
            allowWholeFile: true,
          },
        ],
        'eslint-comments/no-aggregating-enable': 'error',
        'eslint-comments/no-duplicate-disable': 'error',
        'eslint-comments/no-unused-disable': 'error',
        'eslint-comments/no-unused-enable': 'error',
      },
    },
    {
      files: [TS_FILES_GLOB],
      plugins: {
        '@typescript-eslint': {
          ...pluginTypescript,
          // see note below on the parser object in languageOptions
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
          project: './jsconfig.json',
        },
      },
      rules: {
        ...configXoTypescript.rules,
      },
    },
    ...configXoTypescript.overrides,
  ];

  for (const config of userConfigs) {
    if (config.files === undefined) {
      config.files = [ALL_FILES_GLOB];
    }

    if (config.space) {
      config.rules = {
        ...configXoSpace.rules,
        ...config.rules,
      };
    } else {
      config.rules = {
        ...configXo.rules,
        ...config.rules,
      };
    }

    delete config.space;

    if (config.prettier) {
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
            tabWidth: 2,
            useTabs: false,
            semi: true,
          },
        ],
      };
    }

    delete config.prettier;

    baseConfig.push(config);
  }

  return baseConfig;
}

export default createConfig;
