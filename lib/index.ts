import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import process from 'node:process';
import pkg from 'eslint/use-at-your-own-risk'; // eslint-disable-line n/file-extension-in-import
import findCacheDir from 'find-cache-dir';
import {cosmiconfig, defaultLoaders} from 'cosmiconfig';
import {globby} from 'globby';
import pick from 'lodash.pick';
import JSON5 from 'json5';
import {type FlatESLintConfig} from 'eslint-define-config';
import {type ESLint} from 'eslint';
import arrify from 'arrify';
import {
  type XoConfigItem,
  type CliOptions,
  type LintTextOptions,
  type GlobalOptions,
} from './types.js';
import {normalizeOptions} from './options-manager.js';
import {
  DEFAULT_EXTENSION,
  CACHE_DIR_NAME,
  MODULE_NAME,
  TSCONFIG_DEFAULTS,
} from './constants.js';
import createConfig from './create-flat-config.js';

const {FlatESLint} = pkg;

const cacheLocation = (cwd: string) =>
  findCacheDir({name: CACHE_DIR_NAME, cwd}) ??
  path.join(os.homedir() ?? os.tmpdir(), '.xo-cache/');

// Async cosmiconfig loader for es module types
const loadModule = async (fp: string) => {
  const {default: module} = (await import(fp)) as {default: FlatESLintConfig};
  return module;
};

/**
 * Finds the xo config file
 */
const findXoConfig = async (options: CliOptions) => {
  options.cwd = path.resolve(options.cwd ?? process.cwd());

  const globalConfigExplorer = cosmiconfig(MODULE_NAME, {
    searchPlaces: ['package.json'],
    loaders: {noExt: defaultLoaders['.json']},
    stopDir: options.cwd,
  });

  const pkgConfigExplorer = cosmiconfig('engines', {
    searchPlaces: ['package.json'],
    stopDir: options.cwd,
  });

  const flatConfigExplorer = cosmiconfig(MODULE_NAME, {
    searchPlaces: [
      `${MODULE_NAME}.config.js`,
      `${MODULE_NAME}.config.cjs`,
      `${MODULE_NAME}.config.mjs`,
    ],
    stopDir: options.cwd,
    loaders: {
      '.js': loadModule,
      '.mjs': loadModule,
    },
  });

  if (options.filePath) {
    options.filePath = path.resolve(options.cwd, options.filePath);
  }

  const searchPath = options.filePath ?? options.cwd;

  let [
    {config: globalOptions = {}},
    {config: flatOptions = []},
    // {config: enginesOptions = {}},
    {filePath: tsConfigPath = ''},
  ] = await Promise.all([
    (async () =>
      (await globalConfigExplorer.search(searchPath)) ?? {})() as Promise<{
      config: GlobalOptions | undefined;
    }>,
    (async () =>
      (await flatConfigExplorer.search(searchPath)) ?? {})() as Promise<{
      config: XoConfigItem[] | undefined;
    }>,
    // (async () =>
    //   (await pkgConfigExplorer.search(searchPath)) ?? {})() as Promise<{
    //   config: {engines: string} | undefined;
    // }>,
    (async () => {
      if (!options.tsconfig) {
        const tsConfigExplorer = cosmiconfig('ts', {
          searchPlaces: ['tsconfig.json'],
          loaders: {
            '.json': (_, content) =>
              JSON5.parse<Record<string, unknown>>(content),
          },
          stopDir: os.homedir(),
        });

        const searchResults = (await tsConfigExplorer.search(
          options.filePath,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        )) || {
          filepath: undefined,
        };

        if (searchResults?.filepath) options.tsconfig = searchResults.filepath;

        return (await tsConfigExplorer.search(searchPath)) ?? {};
      }

      return {};
    })() as Promise<{
      filePath: string | undefined;
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
  ];

  const flatOnlyKeys = ['plugins'];

  globalOptions = pick(normalizeOptions(globalOptions), globalKeys);
  flatOptions = flatOptions.map((conf) =>
    pick(normalizeOptions(conf), [...globalKeys, ...flatOnlyKeys]),
  );

  return {
    globalOptions,
    // enginesOptions,
    flatOptions,
    tsConfigPath,
  };
};

/**
 * Lint a file or files
 */
const lintFiles = async (globs: string | string[], options: CliOptions) => {
  if (!options.cwd) options.cwd = process.cwd();

  if (!path.isAbsolute(options.cwd))
    options.cwd = path.resolve(process.cwd(), options.cwd);

  const {flatOptions, globalOptions, tsConfigPath} = await findXoConfig(
    options,
  );

  if (!globs || (Array.isArray(globs) && globs.length === 0)) {
    globs = `**/*.{${DEFAULT_EXTENSION.join(',')}}`;
  }

  const files = await globby(globs, {
    gitignore: true,
    absolute: true,
    cwd: options.cwd,
  });

  if (!options.tsconfig && tsConfigPath) {
    const _tsConfigPath = path.join(
      cacheLocation(options.cwd),
      'tsconfig.cached.json',
    );
    await fs.mkdir(path.dirname(_tsConfigPath), {recursive: true});
    await fs.writeFile(
      _tsConfigPath,
      JSON.stringify({
        ...TSCONFIG_DEFAULTS,
        files,
        include: [],
        exclude: [],
      }),
    );

    options.tsconfig = _tsConfigPath;
  }

  let ignores: string[] = [];

  if (typeof options.ignores === 'string') ignores = arrify(options.ignores);
  else if (Array.isArray(options.ignores)) ignores = options.ignores;
  else if (typeof globalOptions.ignores === 'string')
    ignores = arrify(globalOptions.ignores);
  else if (Array.isArray(globalOptions.ignores))
    ignores = globalOptions.ignores;

  const overrideConfig = await createConfig(
    {
      ...globalOptions,
      ...options,
      ignores,
    },
    flatOptions,
  );

  const eslint = new FlatESLint({
    cwd: options.cwd,
    overrideConfigFile: true,
    overrideConfig,
    cache: true,
    cacheLocation: path.join(cacheLocation(options.cwd), 'flat-xo-cache.json'),
  });

  const results = await eslint.lintFiles(files);

  const rulesMeta = eslint.getRulesMetaForResults(results);
  return {
    results,
    rulesMeta,
    ...results[0],
  };
};

const lintText = async (code: string, options: LintTextOptions) => {
  options.cwd = options.cwd ?? process.cwd();

  const config = await findXoConfig(options);
  const overrideConfig = await createConfig(config);

  const eslint = new FlatESLint({
    cwd: options.cwd,
    overrideConfigFile: true,
    overrideConfig,
    cache: true,
    cacheLocation: path.join(
      findCacheDir({name: CACHE_DIR_NAME, cwd: options.cwd}) ??
        path.join(os.homedir() ?? os.tmpdir(), '.flat-xo-cache/'),
      'flat-xo-cache.json',
    ),
  });

  const results = await eslint.lintText(code, {
    filePath: options.filePath,
    warnIgnored: options.warnIgnored,
  });

  return {
    results,
    ...results[0],
  };
};

const outputFixes = async ({results}: {results: ESLint.LintResult[]}) =>
  FlatESLint.outputFixes(results);

const getFormatter = async (name: string) => {
  const {format} = await new FlatESLint().loadFormatter(name);
  return format;
};

const getConfig = async (options: CliOptions): Promise<unknown> => {
  if (!options.filePath) throw new Error('filePath is required');

  const config = await findXoConfig(options);
  const eslint = new FlatESLint({
    cwd: options.cwd,
    overrideConfigFile: true,
    overrideConfig: await createConfig(config),
    cache: true,
    cacheLocation: path.join(
      findCacheDir({name: CACHE_DIR_NAME, cwd: options.cwd}) ??
        path.join(os.homedir() ?? os.tmpdir(), '.flat-xo-cache/'),
      'flat-xo-cache.json',
    ),
  });
  return eslint.calculateConfigForFile(options.filePath);
};

const xo = {
  getFormatter,
  getErrorResults: FlatESLint.getErrorResults,
  outputFixes,
  getConfig,
  lintText,
  lintFiles,
};

export default xo;
