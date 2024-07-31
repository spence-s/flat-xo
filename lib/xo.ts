import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import process from 'node:process';
import {ESLint, type Linter} from 'eslint';
import findCacheDir from 'find-cache-dir';
import {globby} from 'globby';
import arrify from 'arrify';
import defineLazyProperty from 'define-lazy-prop';
import {type FlatESLintConfig} from 'eslint-define-config';
import {type SetRequired} from 'type-fest';
import {
  type XoLintResult,
  type LintOptions,
  type LintTextOptions,
  type FlatXoConfig,
} from './types.js';
import {
  CACHE_DIR_NAME,
  TSCONFIG_DEFAULTS,
  TS_FILES_GLOB,
  ALL_EXTENSIONS,
} from './constants.js';
import createConfig from './create-eslint-config.js';
import resolveXoConfig from './resolve-xo-config.js';
import ezTsconfig from './ez-tsconfig.js';

export class XO {
  static async outputFixes(results: XoLintResult) {
    await ESLint.outputFixes(results?.results ?? []);
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

    this.cacheLocation =
      findCacheDir({name: CACHE_DIR_NAME, cwd: this.options.cwd}) ??
      path.join(os.homedir() ?? os.tmpdir(), '.xo-cache/');
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
   * setTsConfig sets the tsconfig on the XO instance
   * @private
   */
  async setTsConfig() {
    if (!this.options.tsconfig) {
      const {path: tsConfigPath, config: tsConfig} =
        ezTsconfig(this.options.cwd, this.options.tsconfig) ?? {};

      const tsConfigCachePath = path.join(
        this.cacheLocation,
        'tsconfig.cached.json',
      );
      await fs.mkdir(path.dirname(tsConfigCachePath), {recursive: true});

      const files = await globby(path.join(this.options.cwd, TS_FILES_GLOB), {
        gitignore: true,
        absolute: true,
        cwd: this.options.cwd,
      });

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
  }

  /**
   * setEslintConfig sets the eslint config on the XO instance
   * @private
   */
  async setEslintConfig() {
    if (!this.xoConfig) {
      throw new Error('"XO.setEslintConfig" failed');
    }

    this.eslintConfig ??= await createConfig([...this.xoConfig], {
      tsconfigPath: this.options.tsconfig,
    });
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
   * @param isFixable
   */
  public async initEslint(isFixable?: boolean) {
    await this.setXoConfig();
    await this.setTsConfig();
    this.setIgnores();
    await this.setEslintConfig();
    this.setCacheLocation();

    if (!this.xoConfig) {
      throw new Error('"XO.initEslint" failed');
    }

    const eslintOptions = {
      cwd: this.options.cwd,
      overrideConfig: this.eslintConfig as Linter.Config,
      overrideConfigFile: true,
      globInputPaths: false,
      warnIgnored: false,
      cache: !isFixable,
      cacheLocation: isFixable ? undefined : this.cacheLocation,
      fix: isFixable,
    };

    this.eslint ??= new ESLint(eslintOptions);
  }

  /**
   * lintFiles lints the files on the XO instance
   * @param globs
   * @returns XoLintResult
   * @throws Error
   */
  async lintFiles(globs?: string | string[]): Promise<XoLintResult> {
    await this.initEslint(this.options.fix);

    if (!this.eslint) {
      throw new Error('Failed to initialize ESLint');
    }

    if (!globs || (Array.isArray(globs) && globs.length === 0)) {
      globs = `**/*.{${ALL_EXTENSIONS.join(',')}}`;
    }

    globs = arrify(globs).map((glob) =>
      path.isAbsolute(glob)
        ? glob
        : path.resolve(this.options?.cwd ?? '.', glob),
    );

    let files: string | string[] = await globby(globs, {
      gitignore: true,
      absolute: true,
      cwd: this.options.cwd,
    });

    if (files.length === 0) {
      files = '!**/*';
    }

    const results = await this.eslint.lintFiles(files);
    const rulesMeta = this.eslint.getRulesMetaForResults(results);
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
    const {filePath, warnIgnored, fix} = lintTextOptions;

    await this.initEslint(fix);

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
