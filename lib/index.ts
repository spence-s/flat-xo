import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import process from 'node:process';
import pkg from 'eslint/use-at-your-own-risk'; // eslint-disable-line n/file-extension-in-import
import findCacheDir from 'find-cache-dir';
import {globby} from 'globby';
// import {type ESLint} from 'eslint';
import isEmpty from 'lodash.isempty';
import arrify from 'arrify';
import {type LintOptions} from './types.js';
import {
  DEFAULT_EXTENSION,
  CACHE_DIR_NAME,
  TSCONFIG_DEFAULTS,
} from './constants.js';
import createConfig from './create-eslint-config.js';
import resolveXoConfig from './resolve-xo-config.js';
import ezTsconfig from './ez-tsconfig.js';

const {FlatESLint} = pkg;

const findCacheLocation = (cwd: string) =>
  findCacheDir({name: CACHE_DIR_NAME, cwd}) ??
  path.join(os.homedir() ?? os.tmpdir(), '.xo-cache/');

const isLintOptions = (
  options?: LintOptions | string | string[],
): options is LintOptions => {
  if (typeof options === 'string') return false;
  if (Array.isArray(options)) return false;
  return true;
};

/**
 * Lint a file or files
 */
export const lintFiles = async (
  globs?: string | string[] | LintOptions,
  options?: LintOptions,
) => {
  if (isLintOptions(globs)) {
    options = globs;
    globs = `**/*.{${DEFAULT_EXTENSION.join(',')}}`;
  }

  if (!options) options = {};

  if (!options.cwd) options.cwd = process.cwd();

  if (!path.isAbsolute(options.cwd))
    options.cwd = path.resolve(process.cwd(), options.cwd);

  const {flatOptions, globalOptions} = await resolveXoConfig(options);

  if (!globs || (Array.isArray(globs) && globs.length === 0)) {
    globs = `**/*.{${DEFAULT_EXTENSION.join(',')}}`;
  }

  const files = await globby(globs, {
    gitignore: true,
    absolute: true,
    cwd: options.cwd,
  });

  /**
   * What we want to do with the tsconfig
   *
   * 1) use something more optimized than cosmiconfig to find the filepath
   * 3) always cache the tsconfig and all globbed files to it
   * 4) turn off eslint globbing after getting full file paths from globby
   * 3) give flag to turn this lookup off completely
   */

  if (!options.ezTs) {
    const {path: tsConfigPath, config: tsConfig} =
      ezTsconfig(options.cwd, options.tsconfig) ?? {};

    const tsConfigCachePath = path.join(
      findCacheLocation(options.cwd),
      'tsconfig.cached.json',
    );
    await fs.mkdir(path.dirname(tsConfigCachePath), {recursive: true});
    await fs.writeFile(
      tsConfigCachePath,
      JSON.stringify({
        ...(tsConfig ?? TSCONFIG_DEFAULTS),
        files,
        include: [],
        exclude: [],
      }),
    );

    options.tsconfig = tsConfigPath;
  }

  let ignores: string[] = [];

  if (typeof options.ignores === 'string') ignores = arrify(options.ignores);
  else if (Array.isArray(options.ignores)) ignores = options.ignores;
  else if (typeof globalOptions.ignores === 'string')
    ignores = arrify(globalOptions.ignores);
  else if (Array.isArray(globalOptions.ignores))
    ignores = globalOptions.ignores;

  const overrideConfig = await createConfig(
    // eslint-disable-next-line no-negated-condition
    !isEmpty(flatOptions)
      ? [
          ...flatOptions,
          {
            ...globalOptions,
            ...options,
            ignores,
          },
        ]
      : {
          ...globalOptions,
          ...options,
          ignores,
        },
  );

  const cacheLocation = path.join(
    findCacheLocation(options.cwd),
    'flat-xo-cache.json',
  );

  const eslint = new FlatESLint({
    cwd: options.cwd,
    overrideConfig,
    overrideConfigFile: true,
    globInputPaths: false,
    cache: true,
    cacheLocation,
  });
  const results = await eslint.lintFiles(files);
  const rulesMeta = eslint.getRulesMetaForResults(results);
  return {
    results,
    rulesMeta,
    ...results[0],
  };
};

// const lintText = async (code: string, options: LintTextOptions) => {
//   options.cwd = options.cwd ?? process.cwd();

//   const config = await resolveXoConfig(options);
//   const overrideConfig = await createConfig(config);

//   const eslint = new FlatESLint({
//     cwd: options.cwd,
//     overrideConfigFile: true,
//     overrideConfig,
//     cache: true,
//     cacheLocation: path.join(
//       findCacheDir({name: CACHE_DIR_NAME, cwd: options.cwd}) ??
//         path.join(os.homedir() ?? os.tmpdir(), '.flat-xo-cache/'),
//       'flat-xo-cache.json',
//     ),
//   });

//   const results = await eslint.lintText(code, {
//     filePath: options.filePath,
//     warnIgnored: options.warnIgnored,
//   });

//   return {
//     results,
//     ...results[0],
//   };
// };

// const outputFixes = async ({results}: {results: ESLint.LintResult[]}) =>
//   FlatESLint.outputFixes(results);

// const getFormatter = async (name: string) => {
//   const {format} = await new FlatESLint().loadFormatter(name);
//   return format;
// };

// const getConfig = async (options: LintOptions): Promise<unknown> => {
//   if (!options.filePath) throw new Error('filePath is required');

//   const config = await resolveXoConfig(options);
//   const eslint = new FlatESLint({
//     cwd: options.cwd,
//     overrideConfigFile: true,
//     overrideConfig: await createConfig(config),
//     cache: true,
//     cacheLocation: path.join(
//       findCacheDir({name: CACHE_DIR_NAME, cwd: options.cwd}) ??
//         path.join(os.homedir() ?? os.tmpdir(), '.flat-xo-cache/'),
//       'flat-xo-cache.json',
//     ),
//   });
//   return eslint.calculateConfigForFile(options.filePath);
// };

// const xo = {
//   getFormatter,
//   getErrorResults: FlatESLint.getErrorResults,
//   outputFixes,
//   getConfig,
//   lintText,
//   lintFiles,
// };

// export default xo;
