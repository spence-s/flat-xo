import path from 'node:path';
import os from 'node:os';
import process from 'node:process';
import pkg from 'eslint/use-at-your-own-risk'; // eslint-disable-line n/file-extension-in-import
import findCacheDir from 'find-cache-dir';
import {cosmiconfig} from 'cosmiconfig';
import createConfig from './lib/create-flat-config.js';

// @ts-ignore
const FlatESLint = pkg.FlatESLint;

const CACHE_DIR_NAME = 'xo-linter';

/**
 * @typedef {import('./types.js').CliOptions} CliOptions
 * @typedef {import('./types.js').XoResults} XoResults
 */

/**
 * Finds the xo config file
 *
 * @param {CliOptions} options
 */
const findXoConfig = async (options) => {
  /** @param {string} fp */
  const loadModule = async (fp) => {
    const {default: module} = await import(fp);
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
 *
 * @param {string[]} globs
 * @param {CliOptions} options
 * @return {Promise<XoResults>}
 */
const lintFiles = async (globs, options) => {
  const config = await findXoConfig(options);
  const eslint = new FlatESLint({
    cwd: process.cwd(),
    overrideConfigFile: true,
    overrideConfig: createConfig(config),
    cache: true,
    cacheLocation: path.join(
      findCacheDir({name: CACHE_DIR_NAME, cwd: options.cwd}) ||
        path.join(os.homedir() || os.tmpdir(), '.xo-cache/'),
      'flat-xo-cache.json',
    ),
  });

  const results = await eslint.lintFiles(globs);

  console.log(results);

  return {
    results,
    ...results[0],
  };
};

/**
 * lint a string of text
 *
 * @param {string} code
 * @param {CliOptions} options
 * @returns {Promise<XoResults>}
 */
const lintText = async (code, options) => {
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

  const results = await eslint.lintText(code, {
    filePath: options.filePath,
    warnIgnored: options.warnIgnored,
  });

  console.log(results);

  return {
    results,
    ...results[0],
  };
};

/**
 * Applies eslint fixes to all files in results
 *
 * @param {XoResults} options
 * @returns {Promise<void>}
 */
const outputFixes = async ({results}) => FlatESLint.outputFixes(results);

/**
 *
 * @param {string} name
 * @returns {Promise<((results: readonly LintResult[], data?: LintResultData | undefined) => string)>}
 */
const getFormatter = async (name) => {
  const {format} = await new FlatESLint().loadFormatter(name);
  return format;
};

/**
 * Applies eslint fixes to all files in results
 *
 * @param {CliOptions} options
 * @returns {Promise<void>}
 */
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
