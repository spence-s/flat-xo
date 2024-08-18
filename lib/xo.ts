import path from 'node:path';
import os from 'node:os';
import process from 'node:process';
import {ESLint, type Linter} from 'eslint';
import findCacheDir from 'find-cache-dir';
import {globby} from 'globby';
import arrify from 'arrify';
import defineLazyProperty from 'define-lazy-prop';
import _debug from 'debug';
import {
  type XoLintResult,
  type LinterOptions,
  type LintTextOptions,
  type FlatXoConfig,
  type XoConfigOptions,
} from './types.js';
import {DEFAULT_IGNORES, CACHE_DIR_NAME, ALL_EXTENSIONS} from './constants.js';
import createConfig from './create-eslint-config/index.js';
import resolveXoConfig from './resolve-config.js';

const debug = _debug('xo');
const initDebug = debug.extend('initEslint');
export class XO {
  /**
   * Static lintText helper for backwards compat and use in editor extensions and other tools
  */
  static async lintText(code: string, options: LintTextOptions & LinterOptions) {
    const xo = new XO(options);
    return xo.lintText(code, options);
  }

  /**
   * Static lintFiles helper for backwards compat and use in editor extensions and other tools
  */
  static async lintFiles(globs: string | undefined, options: LinterOptions) {
    const xo = new XO(options);
    return xo.lintFiles(globs);
  }

  /**
   * Write the fixes to disk
   */
  static async outputFixes(results: XoLintResult) {
    await ESLint.outputFixes(results?.results ?? []);
  }

  /**
   * Required linter options,cwd, fix, and filePath (in case of lintText)
   */
  linterOptions: LinterOptions;
  /**
   * Base XO config options that allow configuration from cli or other sources
   * not to be confused with the xoConfig property which is the resolved XO config from the flat config AND base config
   */
  baseXoConfig: XoConfigOptions;
  /**
   * file path to the eslint cache
   */
  cacheLocation: string;
  /**
   * A re-usable ESLint instance configured with options calculated from the XO config
   */
  eslint?: ESLint;
  /**
   * XO config resolved from both the base config and the flat config
   */
  xoConfig?: FlatXoConfig;
  /**
   * The ESLint config calculated from the resolved XO config
  */
  eslintConfig?: Linter.Config[];
  /**
  * The flat xo config path, if there is one
  */
  flatConfigPath?: string | undefined;

  constructor(_linterOptions: LinterOptions, _baseXoConfig: XoConfigOptions = {}) {
    this.linterOptions = _linterOptions;
    this.baseXoConfig = _baseXoConfig;

    // fix relative cwd paths
    if (!path.isAbsolute(this.linterOptions.cwd)) {
      this.linterOptions.cwd = path.resolve(process.cwd(), this.linterOptions.cwd);
    }

    this.cacheLocation
      = findCacheDir({name: CACHE_DIR_NAME, cwd: this.linterOptions.cwd})
      ?? path.join(os.homedir() ?? os.tmpdir(), '.xo-cache/');
  }

  /**
   * setXoConfig sets the xo config on the XO instance
   * @private
   */
  async setXoConfig() {
    if (!this.xoConfig) {
      const {flatOptions, flatConfigPath} = await resolveXoConfig({
        ...this.linterOptions,
      });
      this.xoConfig = [this.baseXoConfig, ...flatOptions];
      this.flatConfigPath = flatConfigPath;
    }
  }

  /**
   * setEslintConfig sets the eslint config on the XO instance
   * @private
   */
  async setEslintConfig() {
    if (!this.xoConfig) {
      throw new Error('"XO.setEslintConfig" failed');
    }

    this.eslintConfig ??= await createConfig([...this.xoConfig], this.linterOptions.cwd);
  }

  /**
   * setIgnores sets the ignores on the XO instance
   * @private
   */
  setIgnores() {
    if (!this.baseXoConfig.ignores) {
      let ignores: string[] = [];

      if (typeof this.baseXoConfig.ignores === 'string') {
        ignores = arrify(this.baseXoConfig.ignores);
      } else if (Array.isArray(this.baseXoConfig.ignores)) {
        ignores = this.baseXoConfig.ignores;
      }

      if (!this.xoConfig) {
        throw new Error('"XO.setIgnores" failed');
      }

      if (ignores.length > 0) {
        this.xoConfig.push({ignores});
      }
    }
  }

  /**
   * initEslint initializes the ESLint instance on the XO instance
   */
  public async initEslint() {
    await this.setXoConfig();
    initDebug('setXoConfig complete');

    // this.setIgnores();
    // initDebug('setIgnores complete');

    await this.setEslintConfig();
    initDebug('setEslintConfig complete');

    if (!this.xoConfig) {
      throw new Error('"XO.initEslint" failed');
    }

    const eslintOptions = {
      cwd: this.linterOptions.cwd,
      overrideConfig: this.eslintConfig as Linter.Config,
      overrideConfigFile: true,
      globInputPaths: false,
      warnIgnored: false,
      cache: true,
      cacheLocation: this.cacheLocation,
      fix: this.linterOptions.fix,
    };

    this.eslint ??= new ESLint(eslintOptions);
    initDebug('ESLint class created with options %O', eslintOptions);
  }

  /**
   * lintFiles lints the files on the XO instance
   * @param globs glob pattern to pass to globby
   * @returns XoLintResult
   * @throws Error
   */
  async lintFiles(globs?: string | string[]): Promise<XoLintResult> {
    const lintFilesDebug = debug.extend('lintFiles');
    lintFilesDebug('lintFiles called with globs %O');

    await this.initEslint();
    lintFilesDebug('initEslint complete');

    if (!this.eslint) {
      throw new Error('Failed to initialize ESLint');
    }

    if (!globs || (Array.isArray(globs) && globs.length === 0)) {
      globs = `**/*.{${ALL_EXTENSIONS.join(',')}}`;
    }

    globs = arrify(globs);

    let files: string | string[] = await globby(globs, {
      ignore: DEFAULT_IGNORES,
      onlyFiles: true,
      gitignore: true,
      absolute: true,
      cwd: this.linterOptions.cwd,
    });

    lintFilesDebug('globby success %O', files);

    if (files.length === 0) {
      files = '!**/*';
    }

    const results = await this.eslint.lintFiles(files);

    lintFilesDebug('linting files success');

    const rulesMeta = this.eslint.getRulesMetaForResults(results);

    lintFilesDebug('get rulesMeta success');

    return this.processReport(results, {rulesMeta});
  }

  /**
   * lintText lints the text on the XO instance
   * @param code
   * @param lintTextOptions
   * @returns XoLintResult
   * @throws Error
   */
  async lintText(
    code: string,
    lintTextOptions: LintTextOptions,
  ): Promise<XoLintResult> {
    const {filePath, warnIgnored} = lintTextOptions;

    await this.initEslint();

    if (!this.eslint) {
      throw new Error('Failed to initialize ESLint');
    }

    const results = await this.eslint?.lintText(code, {
      filePath,
      warnIgnored,

    });

    const rulesMeta = this.eslint.getRulesMetaForResults(results ?? []);

    return this.processReport(results ?? [], {rulesMeta});
  }

  async calculateConfigForFile(filePath: string): Promise<Linter.Config> {
    await this.initEslint();

    if (!this.eslint) {
      throw new Error('Failed to initialize ESLint');
    }

    return this.eslint.calculateConfigForFile(filePath) as Promise<Linter.Config>;
  }

  async getFormatter(name: string) {
    await this.initEslint();

    if (!this.eslint) {
      throw new Error('Failed to initialize ESLint');
    }

    return this.eslint.loadFormatter(name);
  }

  private processReport(
    report: ESLint.LintResult[],
    {rulesMeta = {}} = {},
  ) {
    if (this.linterOptions.quiet) {
      report = ESLint.getErrorResults(report);
    }

    const result = {
      results: report,
      rulesMeta,
      ...this.getReportStatistics(report),
    };

    defineLazyProperty(result, 'usedDeprecatedRules', () => {
      const seenRules = new Set();
      const rules = [];

      for (const {usedDeprecatedRules} of report) {
        for (const rule of usedDeprecatedRules) {
          if (seenRules.has(rule.ruleId)) {
            continue;
          }

          seenRules.add(rule.ruleId);
          rules.push(rule);
        }
      }

      return rules;
    });

    return result;
  }

  private getReportStatistics(results: ESLint.LintResult[]) {
    const statistics = {
      errorCount: 0,
      warningCount: 0,
      fixableErrorCount: 0,
      fixableWarningCount: 0,
    };

    for (const result of results) {
      statistics.errorCount += result.errorCount;
      statistics.warningCount += result.warningCount;
      statistics.fixableErrorCount += result.fixableErrorCount;
      statistics.fixableWarningCount += result.fixableWarningCount;
    }

    return statistics;
  }
}

export * from './types.js';
export * from './create-eslint-config/index.js';
export default XO;
