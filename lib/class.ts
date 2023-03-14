import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import process from 'node:process';
import pkg, {type FlatESLint} from 'eslint/use-at-your-own-risk'; // eslint-disable-line n/file-extension-in-import
import findCacheDir from 'find-cache-dir';
import {globby} from 'globby';
// import {type ESLint} from 'eslint';
import isEmpty from 'lodash.isempty';
import arrify from 'arrify';
import {type XoLintResult, type LintOptions} from './types.js';
import {
  DEFAULT_EXTENSION,
  CACHE_DIR_NAME,
  TSCONFIG_DEFAULTS,
} from './constants.js';
import createConfig from './create-eslint-config.js';
import resolveXoConfig from './resolve-xo-config.js';
import ezTsconfig from './ez-tsconfig.js';

const {FlatESLint: _FlatESLint} = pkg;

const findCacheLocation = (cwd: string) =>
  findCacheDir({name: CACHE_DIR_NAME, cwd}) ??
  path.join(os.homedir() ?? os.tmpdir(), '.xo-cache/');

// const isLintOptions = (
//   options?: LintOptions | string | string[],
// ): options is LintOptions => {
//   if (typeof options === 'string') return false;
//   if (Array.isArray(options)) return false;
//   return true;
// };

/**
 * since we lint in 1 pass we can fully cache the eslint instance.
 *
 * This could really improve speed for lintText
 *
 */
type LintTextOptions = {
  filePath?: string;
  warnIgnored?: boolean;
};

class XO {
  options: LintOptions;
  eslint?: FlatESLint;

  constructor(_options?: LintOptions) {
    this.options = _options ?? {};
    this.eslint = undefined;
  }

  async initializeEslint(): Promise<FlatESLint> {
    // options?: LintOptions, // globs?: string | string[] | LintOptions,
    if (!this.options.cwd) this.options.cwd = process.cwd();

    if (!path.isAbsolute(this.options.cwd))
      this.options.cwd = path.resolve(process.cwd(), this.options.cwd);

    const {flatOptions, globalOptions} = await resolveXoConfig({
      ...this.options,
    });

    if (!this.options.ezTs) {
      const {path: tsConfigPath, config: tsConfig} =
        ezTsconfig(this.options.cwd, this.options.tsconfig) ?? {};

      const tsConfigCachePath = path.join(
        findCacheLocation(this.options.cwd),
        'tsconfig.cached.json',
      );
      await fs.mkdir(path.dirname(tsConfigCachePath), {recursive: true});

      const files = await globby(
        path.join(this.options.cwd, '/**/*.{ts,tsx,mts,cts}'),
        {
          gitignore: true,
          absolute: true,
          cwd: this.options.cwd,
        },
      );

      await fs.writeFile(
        tsConfigCachePath,
        JSON.stringify({
          ...(tsConfig ?? TSCONFIG_DEFAULTS),
          files,
          include: [],
          exclude: [],
        }),
      );

      this.options.tsconfig = tsConfigPath;
    }

    let ignores: string[] = [];

    if (typeof this.options.ignores === 'string')
      ignores = arrify(this.options.ignores);
    else if (Array.isArray(this.options.ignores))
      ignores = this.options.ignores;
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
              ...this.options,
              ignores,
            },
          ]
        : {
            ...globalOptions,
            ...this.options,
            ignores,
          },
    );

    const cacheLocation = path.join(
      findCacheLocation(this.options.cwd),
      'flat-xo-cache.json',
    );

    this.eslint = new _FlatESLint({
      cwd: this.options.cwd,
      overrideConfig,
      overrideConfigFile: true,
      globInputPaths: false,
      cache: true,
      cacheLocation,
    });

    return this.eslint;
  }

  async lintFiles(globs?: string | string[]): Promise<XoLintResult> {
    if (!this.eslint) this.eslint = await this.initializeEslint();

    if (!globs || (Array.isArray(globs) && globs.length === 0)) {
      globs = `**/*.{${DEFAULT_EXTENSION.join(',')}}`;
    }

    const files = await globby(globs, {
      gitignore: true,
      absolute: true,
      cwd: this.options.cwd,
    });

    const results = await this.eslint.lintFiles(files);
    const rulesMeta = this.eslint.getRulesMetaForResults(results);
    return {
      results,
      rulesMeta,
      ...results[0],
    };
  }

  async lintText(
    code: string,
    {filePath, warnIgnored}: LintTextOptions,
  ): Promise<XoLintResult> {
    if (!this.eslint) this.eslint = await this.initializeEslint();

    const results = await this.eslint.lintText(code, {
      filePath,
      warnIgnored,
    });
    const rulesMeta = this.eslint.getRulesMetaForResults(results);
    return {
      results,
      rulesMeta,
      ...results[0],
    };
  }
}

export default XO;
