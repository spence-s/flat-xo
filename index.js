import path from 'node:path';
import os from 'node:os';
import process from 'node:process';
import pkg from 'eslint/use-at-your-own-risk'; // eslint-disable-line n/file-extension-in-import
import findCacheDir from 'find-cache-dir';
import {cosmiconfig} from 'cosmiconfig';
import createConfig from './create-flat-config.js';
import {DEFAULT_EXTENSION} from './lib/constants.js';

// @ts-ignore
const FlatESLint = pkg.FlatESLint;

const CACHE_DIR_NAME = 'xo-linter';

/**
 * Finds the xo config file
 */
const findXoConfig = async (options) => {
  /** @param {string} fp */
  const loadModule = async (fp) => {
    const {default: module, ignores, tsconfig} = await import(fp);
    module.ignores = ignores;
    module.tsconfig = tsconfig;
    return module;
  };

  const configExplorer = cosmiconfig('xo', {
    searchPlaces: [`xo.config.js`, `xo.config.cjs`],
    stopDir: options.cwd,
    loaders: {
      '.js': loadModule,
      '.mjs': loadModule,
    },
  });
  const searchPath = options.filePath || options.cwd;
  const {config: xoOptions} = (await configExplorer.search(searchPath)) || {};
  return xoOptions;
};

/**
 * lint a file or files
 */
const lintFiles = async (globs, options) => {
  const config = await findXoConfig(options);
  options.cwd = options.cwd ?? process.cwd();
  const overrideConfig = await createConfig(config);
  const eslint = new FlatESLint({
    cwd: options.cwd,
    overrideConfigFile: true,
    overrideConfig,
    cache: true,
    cacheLocation: path.join(
      findCacheDir({name: CACHE_DIR_NAME, cwd: options.cwd}) ||
        path.join(os.homedir() || os.tmpdir(), '.xo-cache/'),
      'flat-xo-cache.json',
    ),
  });

  if (!globs || (Array.isArray(globs) && globs.length === 0)) {
    globs = `**/*.{${DEFAULT_EXTENSION.join(',')}}`;
  }

  console.log('globs', globs);
  const results = await eslint.lintFiles(globs);
  return {
    results,
    ...results[0],
  };
};

/**
 * lint a string of text
 */
const lintText = async (code, options) => {
  const config = await findXoConfig(options);
  options.cwd = options.cwd ?? process.cwd();
  const overrideConfig = await createConfig(config);
  const eslint = new FlatESLint({
    cwd: options.cwd,
    overrideConfigFile: true,
    overrideConfig,
    cache: true,
    cacheLocation: path.join(
      findCacheDir({name: CACHE_DIR_NAME, cwd: options.cwd}) ||
        path.join(os.homedir() || os.tmpdir(), '.xo-cache/'),
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
    overrideConfig: createConfig(config),
    cache: true,
    cacheLocation: path.join(
      findCacheDir({name: CACHE_DIR_NAME, cwd: options.cwd}) ||
        path.join(os.homedir() || os.tmpdir(), '.xo-cache/'),
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
