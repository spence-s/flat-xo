import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import process from 'node:process';
import {loadESLint, type ESLint, type Linter} from 'eslint';
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

const FlatESLint = await loadESLint({useFlatConfig: true});

const findCacheLocation = (cwd: string) =>
  findCacheDir({name: CACHE_DIR_NAME, cwd}) ??
  path.join(os.homedir() ?? os.tmpdir(), '.xo-cache/');

/**
 * Since we lint in 1 pass we can fully cache the eslint instance.
 *
 * This could really improve speed for lintText
 *
 */

export class XO {
  static async outputFixes(results: XoLintResult) {
    return FlatESLint.outputFixes(results?.results ?? []);
  }

  options: SetRequired<LintOptions, 'cwd'>;
  eslint?: ESLint;
  fixableEslint?: ESLint;
  xoConfig?: FlatXoConfig;
  configPath?: string;
  eslintConfig?: FlatESLintConfig[];
  flatConfigPath?: string;
  globs?: string | string[];

  constructor(_options?: LintOptions) {
    _options ??= {cwd: ''};
    _options.cwd ||= process.cwd();
    this.options = _options as SetRequired<LintOptions, 'cwd'>;

    // fix relative cwd paths
    if (!path.isAbsolute(this.options.cwd)) {
      this.options.cwd = path.resolve(process.cwd(), this.options.cwd);
    }
  }

  async handleXoConfig() {
    if (!this.xoConfig) {
      const {flatOptions, flatConfigPath} = await resolveXoConfig({
        ...this.options,
      });
      this.xoConfig = flatOptions;
      this.flatConfigPath = flatConfigPath;
    }
  }

  async handleTsConfig() {
    if (!this.options.tsconfig) {
      const {path: tsConfigPath, config: tsConfig} =
        ezTsconfig(this.options.cwd, this.options.tsconfig) ?? {};

      const tsConfigCachePath = path.join(
        findCacheLocation(this.options.cwd),
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

  async getEslintConfig() {
    if (!this.eslintConfig) {
      if (!this.xoConfig) {
        throw new Error('"XO.getEslintConfig" failed');
      }

      const eslintConfig = await createConfig(
        [...this.xoConfig],
        this.options.tsconfig,
      );
      this.eslintConfig = eslintConfig;
    }

    return this.eslintConfig;
  }

  async initEslint(isFixable?: boolean): Promise<ESLint> {
    await this.handleXoConfig();

    if (!this.xoConfig) {
      throw new Error('"XO.handleConfig" failed');
    }

    await this.handleTsConfig();

    let ignores: string[] = [];

    if (typeof this.options.ignores === 'string') {
      ignores = arrify(this.options.ignores);
    } else if (Array.isArray(this.options.ignores)) {
      ignores = this.options.ignores;
    }

    if (ignores.length > 0) {
      this.xoConfig.push({ignores});
    }

    const overrideConfig = (await this.getEslintConfig()) as Linter.Config;
    const cacheLocation = path.join(
      findCacheLocation(this.options.cwd),
      'flat-xo-cache.json',
    );

    this.eslint = new FlatESLint({
      cwd: this.options.cwd,
      overrideConfig,
      overrideConfigFile: true,
      globInputPaths: false,
      warnIgnored: false,
      cache: true,
      cacheLocation,
      fix: isFixable,
    });

    return this.eslint;
  }

  async lintFiles(globs?: string | string[]): Promise<XoLintResult> {
    this.eslint ||= await this.initEslint();

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

  async lintText(
    code: string,
    lintTextOptions: LintTextOptions,
  ): Promise<XoLintResult> {
    const {filePath, warnIgnored, fix} = lintTextOptions;

    this.eslint ||= await this.initEslint();

    const results = await this[fix ? 'fixableEslint' : 'eslint']?.lintText(
      code,
      {
        filePath,
        warnIgnored,
      },
    );

    const rulesMeta = this.eslint.getRulesMetaForResults(results ?? []);

    return this.processReport(results ?? [], {rulesMeta});
  }

  async calculateConfigForFile(filePath: string): Promise<ESLint.Options> {
    this.eslint ||= await this.initEslint();

    return this.eslint.calculateConfigForFile(filePath) as ESLint.Options;
  }

  processReport(
    report: ESLint.LintResult[],
    {isQuiet = false, rulesMeta = {}} = {},
  ) {
    if (isQuiet) {
      report = FlatESLint.getErrorResults(report);
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
