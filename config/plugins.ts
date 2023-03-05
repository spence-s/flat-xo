import {type ESLintConfig} from 'eslint-define-config';

const config: ESLintConfig = {
  // Repeated here from eslint-config-xo in case some plugins set something different
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  // -- End repeat
  plugins: [
    'no-use-extend-native',
    'ava',
    'unicorn',
    // Disabled as the plugin doesn't support ESLint 8 yet.
    // 'promise',
    'import',
    'n', // eslint-plugin-node's successor
    'eslint-comments',
  ],
  extends: ['plugin:ava/recommended', 'plugin:unicorn/recommended'],
  settings: {
    'import/core-modules': ['electron', 'atom'],
  },
  rules: {
    'no-use-extend-native/no-use-extend-native': 'error',

    // TODO: Remove this override at some point.
    // It's just here to ease users into readable variable names.
    'unicorn/prevent-abbreviations': [
      'error',
      {
        checkFilenames: false,
        checkDefaultAndNamespaceImports: false,
        checkShorthandImports: false,
        extendDefaultReplacements: false,
        replacements: {
          // https://thenextweb.com/dd/2020/07/13/linux-kernel-will-no-longer-use-terms-blacklist-and-slave/
          whitelist: {
            include: true,
          },
          blacklist: {
            exclude: true,
          },
          master: {
            main: true,
          },
          slave: {
            secondary: true,
          },

          // Not part of `eslint-plugin-unicorn`
          application: {
            app: true,
          },
          applications: {
            apps: true,
          },

          // Part of `eslint-plugin-unicorn`
          arr: {
            array: true,
          },
          e: {
            error: true,
            event: true,
          },
          el: {
            element: true,
          },
          elem: {
            element: true,
          },
          len: {
            length: true,
          },
          msg: {
            message: true,
          },
          num: {
            number: true,
          },
          obj: {
            object: true,
          },
          opts: {
            options: true,
          },
          param: {
            parameter: true,
          },
          params: {
            parameters: true,
          },
          prev: {
            previous: true,
          },
          req: {
            request: true,
          },
          res: {
            response: true,
            result: true,
          },
          ret: {
            returnValue: true,
          },
          str: {
            string: true,
          },
          temp: {
            temporary: true,
          },
          tmp: {
            temporary: true,
          },
          val: {
            value: true,
          },
          err: {
            error: true,
          },
        },
      },
    ],
    // The character class sorting is a bit buggy at the moment.
    'unicorn/better-regex': [
      'error',
      {
        sortCharacterClasses: false,
      },
    ],

    // We only enforce it for single-line statements to not be too opinionated.
    'unicorn/prefer-ternary': ['error', 'only-single-line'],

    // It will be disabled in the next version of eslint-plugin-unicorn.
    'unicorn/prefer-json-parse-buffer': 'off',

    // Disabled as the plugin doesn't support ESLint 8 yet.
    // 'promise/param-names': 'error',
    // 'promise/no-return-wrap': [
    // 	'error',
    // 	{
    // 		allowReject: true,
    // 	},
    // ],
    // 'promise/no-new-statics': 'error',
    // 'promise/no-return-in-finally': 'error',
    // 'promise/valid-params': 'error',
    // 'promise/prefer-await-to-then': 'error',

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

    // Enabled, but disabled on TypeScript (https://github.com/xojs/xo/issues/576)
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

    // We use `unicorn/prefer-module` instead.
    // 'import/no-commonjs': 'error',

    // Looks useful, but too unstable at the moment
    // 'import/no-deprecated': 'error',

    'import/no-extraneous-dependencies': 'error',
    'import/no-mutable-exports': 'error',
    'import/no-named-as-default-member': 'error',
    'import/no-named-as-default': 'error',

    // Disabled because it's buggy and it also doesn't work with TypeScript
    // 'import/no-unresolved': [
    // 	'error',
    // 	{
    // 		commonjs: false
    // 	}
    // ],

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
    // We have this enabled in addition to `import/extensions` as this one has an auto-fix.
    'n/file-extension-in-import': [
      'error',
      'always',
      {
        // TypeScript doesn't yet support using extensions and fails with error TS2691.
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
};

export default config;
