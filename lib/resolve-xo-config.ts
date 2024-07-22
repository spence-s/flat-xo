import path from 'node:path';
import process from 'node:process';
import {cosmiconfig, defaultLoaders} from 'cosmiconfig';
import pick from 'lodash.pick';
// import {type FlatESLintConfig} from 'eslint-define-config';
import {type LintOptions, type FlatXoConfig} from './types.js';
import {MODULE_NAME} from './constants.js';

// Async cosmiconfig loader for es module types
// const loadModule = async (fp: string) => {
//   const {default: module} = (await import(`${fp}?ts=${Date.now()}`)) as {
//     default: FlatESLintConfig;
//   };
//   return module;
// };

/**
 * Finds the xo config file
 */
export async function resolveXoConfig(options: LintOptions): Promise<{
  flatOptions: FlatXoConfig;
  flatConfigPath: string;
  enginesOptions: {engines?: string};
}> {
  options.cwd ||= process.cwd();

  if (!path.isAbsolute(options.cwd)) {
    options.cwd = path.resolve(process.cwd(), options.cwd);
  }

  const stopDirectory = path.dirname(options.cwd);

  const packageConfigExplorer = cosmiconfig('engines', {
    searchPlaces: ['package.json'],
    stopDir: options.cwd,
  });

  const flatConfigExplorer = cosmiconfig(MODULE_NAME, {
    searchPlaces: [
      `${MODULE_NAME}.config.js`,
      `${MODULE_NAME}.config.cjs`,
      `${MODULE_NAME}.config.mjs`,
      `${MODULE_NAME}.config.ts`,
      `${MODULE_NAME}.config.cts`,
      `${MODULE_NAME}.config.mts`,
    ],
    loaders: {
      '.cts': defaultLoaders['.ts'],
      '.mts': defaultLoaders['.ts'],
    },
    stopDir: stopDirectory,
    cache: true,
  });

  options.filePath &&= path.resolve(options.cwd, options.filePath);

  const searchPath = options.filePath ?? options.cwd;

  let [
    {config: flatOptions = [], filepath: flatConfigPath = ''},
    {config: enginesOptions = {}},
  ] = await Promise.all([
    (async () =>
      (await flatConfigExplorer.search(searchPath)) ?? {})() as Promise<{
      config: FlatXoConfig | undefined;
      filepath: string;
    }>,
    (async () =>
      (await packageConfigExplorer.search(searchPath)) ?? {})() as Promise<{
      config: {engines: string} | undefined;
    }>,
  ]);

  const globalKeys = [
    'ignores',
    'settings',
    'parserOptions',
    'prettier',
    'semicolon',
    'space',
    'rules',
    'env',
    'extension',
    'files',
    'plugins',
  ];

  flatOptions = flatOptions.map((config) => pick(config, globalKeys));

  return {
    enginesOptions,
    flatOptions,
    flatConfigPath,
  };
}

export default resolveXoConfig;
