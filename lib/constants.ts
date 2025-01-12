import {type TsConfigJsonResolved} from 'get-tsconfig';

export const DEFAULT_IGNORES = [
  '**/node_modules/**',
  '**/bower_components/**',
  'flow-typed/**',
  'coverage/**',
  '{tmp,temp}/**',
  '**/*.min.js',
  'vendor/**',
  'dist/**',
  'tap-snapshots/*.{cjs,js}',
];

/**
List of options that values will be concatenanted during option merge.
Only applies to options defined as an Array.
*/
export const MERGE_OPTIONS_CONCAT = ['extends', 'envs', 'globals', 'plugins'];

export const TS_EXTENSIONS = ['ts', 'tsx', 'cts', 'mts'];

export const JS_EXTENSIONS = ['js', 'jsx', 'mjs', 'cjs'];

export const JS_FILES_GLOB = `**/*.{${JS_EXTENSIONS.join(',')}}`;

export const TS_FILES_GLOB = `**/*.{${TS_EXTENSIONS.join(',')}}`;

export const ALL_EXTENSIONS = [...JS_EXTENSIONS, ...TS_EXTENSIONS];

export const ALL_FILES_GLOB = `**/*.{${ALL_EXTENSIONS.join(',')}}`;

export const MODULE_NAME = 'xo';

export const CONFIG_FILES = [
  'package.json',
  `.${MODULE_NAME}-config`,
  `.${MODULE_NAME}-config.json`,
  `.${MODULE_NAME}-config.js`,
  `.${MODULE_NAME}-config.cjs`,
  `${MODULE_NAME}.config.js`,
  `${MODULE_NAME}.config.cjs`,
];

export const TSCONFIG_DEFAULTS: TsConfigJsonResolved = {
  compilerOptions: {
    target: 'es2018',
    strict: true,
    noImplicitReturns: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    noFallthroughCasesInSwitch: true,
  },
};

export const CACHE_DIR_NAME = 'xo-linter';
