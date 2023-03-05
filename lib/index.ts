import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import process from 'node:process';
import pkg from 'eslint/use-at-your-own-risk'; // eslint-disable-line n/file-extension-in-import
import findCacheDir from 'find-cache-dir';
import {cosmiconfig, defaultLoaders} from 'cosmiconfig';
import {globby} from 'globby';
import pick from 'lodash.pick';
// import JSON5 from 'json5';
import {type FlatESLintConfig} from 'eslint-define-config';
import {
  type XoConfigItem,
  type CliOptions,
  type BaseXoConfig,
  type LintTextOptions,
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

  const tsConfigExplorer = cosmiconfig('ts', {
    searchPlaces: ['tsconfig.json'],
    loaders: {'.json': () => null},
    stopDir: os.homedir(),
  });

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const searchResults = (await tsConfigExplorer.search(options.filePath)) || {
    filepath: undefined,
  };

  if (searchResults?.filepath) options.tsConfigPath = searchResults.filepath;

  let [
    {config: globalOptions = {}},
    {config: flatOptions = []},
    {config: enginesOptions = {}},
    {filePath: tsConfigPath = ''},
  ] = await Promise.all([
    (async () =>
      (await globalConfigExplorer.search(searchPath)) ?? {})() as Promise<{
      config: BaseXoConfig | undefined;
    }>,
    (async () =>
      (await flatConfigExplorer.search(searchPath)) ?? {})() as Promise<{
      config: XoConfigItem[] | undefined;
    }>,
    (async () =>
      (await pkgConfigExplorer.search(searchPath)) ?? {})() as Promise<{
      config: {engines: string} | undefined;
    }>,
    (async () =>
      (await tsConfigExplorer.search(searchPath)) ?? {})() as Promise<{
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
    enginesOptions,
    flatOptions,
    tsConfigPath,
  };
};

/**
 * Lint a file or files
 */
const lintFiles = async (globs: string | string[], options: CliOptions) => {
  const {flatOptions, globalOptions, enginesOptions, tsConfigPath} =
    await findXoConfig(options);

  if (!globs || (Array.isArray(globs) && globs.length === 0)) {
    globs = `**/*.{${DEFAULT_EXTENSION.join(',')}}`;
  }

  const files = await globby(globs, {
    gitignore: true,
    absolute: true,
    cwd: options.cwd,
  });

  if (!tsConfigPath) {
    options.tsConfigPath = path.join(
      cacheLocation(options.cwd),
      'tsconfig.cached.json',
    );
    await fs.mkdir(path.dirname(options.tsConfigPath), {recursive: true});
    await fs.writeFile(
      options.tsConfigPath,
      JSON.stringify({
        ...TSCONFIG_DEFAULTS,
        files,
        include: [],
        exclude: [],
      }),
    );
  }

  const overrideConfig = await createConfig({
    ignores: options.ignores ?? globalOptions.ignores,
    flatOptions,
    enginesOptions,
    cwd: options.cwd,
  });

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

/**
 * Lint a string of text
 */
const lintText = async (code: string, options: LintTextOptions) => {
  const config = await findXoConfig(options);
  options.cwd = options.cwd ?? process.cwd();
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

const outputFixes = async ({results}) => FlatESLint.outputFixes(results);

const getFormatter = async (name) => {
  const {format} = await new FlatESLint().loadFormatter(name);
  return format;
};

const getConfig = async (options) => {
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
