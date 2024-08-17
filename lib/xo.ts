import path from 'node:path';
import os from 'node:os';
import process from 'node:process';
import {ESLint, type Linter} from 'eslint';
import findCacheDir from 'find-cache-dir';
import {globby} from 'globby';
import arrify from 'arrify';
import defineLazyProperty from 'define-lazy-prop';
import {type FlatESLintConfig} from 'eslint-define-config';
import {type SetRequired} from 'type-fest';
import _debug from 'debug';
import {
  type XoLintResult,
  type LintOptions,
  type LintTextOptions,
  type FlatXoConfig,
} from './types.js';
import {DEFAULT_IGNORES, CACHE_DIR_NAME, ALL_EXTENSIONS} from './constants.js';
import createConfig from './create-eslint-config.js';
import resolveXoConfig from './resolve-xo-config.js';

const debug = _debug('xo');
const initDebug = debug.extend('initEslint');
export class XO {
  static async outputFixes(results: XoLintResult) {
    await ESLint.outputFixes(results?.results ?? []);
  }

  /** Static lintText helper for backwards compat */
  static async lintText(code: string, options: LintTextOptions) {
    const xo = new XO(options);
    return xo.lintText(code, options);
  }

  /** Static lintFiles helper for backwards compat */
  static async lintFiles(globs: string | undefined, options: LintOptions) {
    const xo = new XO(options);
    return xo.lintFiles(globs);
  }

  options: SetRequired<LintOptions, 'cwd'>;
  cacheLocation: string;
  eslint?: ESLint;
  xoConfig?: FlatXoConfig;
  configPath?: string;
  eslintConfig?: FlatESLintConfig[];
  flatConfigPath?: string;
  ignores?: string | string[];

  constructor(_options?: LintOptions) {
    _options ??= {cwd: ''};
    _options.cwd ||= process.cwd();
    this.options = _options as SetRequired<LintOptions, 'cwd'>;

    // fix relative cwd paths
    if (!path.isAbsolute(this.options.cwd)) {
      this.options.cwd = path.resolve(process.cwd(), this.options.cwd);
    }

    this.cacheLocation
      = findCacheDir({name: CACHE_DIR_NAME, cwd: this.options.cwd})
      ?? path.join(os.homedir() ?? os.tmpdir(), '.xo-cache/');
  }

  /**
   * setXoConfig sets the xo config on the XO instance
   * @private
   */
  async setXoConfig() {
    if (!this.xoConfig) {
      const {flatOptions, flatConfigPath} = await resolveXoConfig({
        ...this.options,
      });
      this.xoConfig = flatOptions;
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

    this.eslintConfig ??= await createConfig([...this.xoConfig]);
  }

  /**
   * setIgnores sets the ignores on the XO instance
   * @private
   */
  setIgnores() {
    if (!this.ignores) {
      let ignores: string[] = [];

      if (typeof this.options.ignores === 'string') {
        ignores = arrify(this.options.ignores);
      } else if (Array.isArray(this.options.ignores)) {
        ignores = this.options.ignores;
      }

      if (!this.xoConfig) {
        throw new Error('"XO.setIgnores" failed');
      }

      if (ignores.length > 0) {
        this.xoConfig.push({ignores});
      }

      // console.log('ignores', ignores);
      this.ignores = ignores;
    }
  }

  /**
   * setCacheLocation sets the cache location on the XO instance
   * @private
   */
  setCacheLocation() {
    this.cacheLocation ??= path.join(this.cacheLocation, 'flat-xo-cache.json');
  }

  /**
   * initEslint initializes the ESLint instance on the XO instance
   */
  public async initEslint() {
    await this.setXoConfig();
    initDebug('setXoConfig complete');

    this.setIgnores();
    initDebug('setIgnores complete');

    await this.setEslintConfig();
    initDebug('setEslintConfig complete');

    this.setCacheLocation();
    initDebug('setCacheLocation complete');

    if (!this.xoConfig) {
      throw new Error('"XO.initEslint" failed');
    }

    const eslintOptions = {
      cwd: this.options.cwd,
      overrideConfig: this.eslintConfig as Linter.Config,
      overrideConfigFile: true,
      globInputPaths: false,
      warnIgnored: false,
      cache: true,
      cacheLocation: this.cacheLocation,
      fix: this.options.fix,
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
      cwd: this.options.cwd,
    });

    lintFilesDebug('globby success %O', files);

    if (files.length === 0) {
      files = '!**/*';
    }

    const results = await this.eslint.lintFiles(files);

    lintFilesDebug('linting files success');

    const rulesMeta = this.eslint.getRulesMetaForResults(results);

    lintFilesDebug('get rulesMeta success');

    return {
      results,
      rulesMeta,
      ...results[0],
    };
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

  async calculateConfigForFile(filePath: string): Promise<ESLint.Options> {
    await this.initEslint();

    if (!this.eslint) {
      throw new Error('Failed to initialize ESLint');
    }

    return this.eslint.calculateConfigForFile(filePath) as ESLint.Options;
  }

  processReport(
    report: ESLint.LintResult[],
    {isQuiet = false, rulesMeta = {}} = {},
  ) {
    if (isQuiet) {
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

  getReportStatistics = (results: ESLint.LintResult[]) => {
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
  };
}

export default XO;
