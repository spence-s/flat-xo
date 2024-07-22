import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import process from 'node:process';
import {loadESLint, type ESLint} from 'eslint';
import findCacheDir from 'find-cache-dir';
import {globby} from 'globby';
import arrify from 'arrify';
import defineLazyProperty from 'define-lazy-prop';
import {type FlatESLintConfig} from 'eslint-define-config';
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

declare module 'eslint' {
  type LoadESLintOptions = {
    useFlatConfig?: boolean | undefined;
    cwd?: string | undefined;
  };

  export class FlatESLint {
    static version: string;
    static outputFixes(results: ESLint.LintResult[]): Promise<void>;
    static getErrorResults(results: ESLint.LintResult[]): ESLint.LintResult[];
    cwd: string;
    overrideConfigFile: boolean;
    overrideConfig: FlatESLintConfig[];
    cache: boolean;
    cacheLocation: string;
    constructor(options?: ESLint.Options);
    lintFiles(patterns: string | string[]): Promise<ESLint.LintResult[]>;
    lintText(
      code: string,
      options?: {
        filePath?: string | undefined;
        warnIgnored?: boolean | undefined;
      },
    ): Promise<ESLint.LintResult[]>;
    getRulesMetaForResults(
      results: ESLint.LintResult[],
    ): ESLint.LintResultData['rulesMeta'];
    calculateConfigForFile(filePath: string): Promise<any>;
    isPathIgnored(filePath: string): Promise<boolean>;
    loadFormatter(nameOrPath?: string): Promise<ESLint.Formatter>;
  }

  export const loadESLint: (options: LoadESLintOptions) => Promise<FlatESLint>;
}

const FlatESLint: ESLint = await loadESLint({useFlatConfig: true});

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
    // @ts-expect-error - IDK whats going on here
    return FlatESLint.outputFixes(results?.results ?? []); // eslint-disable-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
  }

  options: LintOptions;
  eslint?: ESLint;
  fixableEslint?: ESLint;
  config?: FlatXoConfig;
  configPath?: string;
  overrideConfig?: FlatESLintConfig[];
  flatConfigPath?: string;

  constructor(_options?: LintOptions) {
    this.options = _options ?? {};
  }

  async initEslint(): Promise<ESLint> {
    this.options.cwd ||= process.cwd();

    if (!path.isAbsolute(this.options.cwd)) {
      this.options.cwd = path.resolve(process.cwd(), this.options.cwd);
    }

    if (!this.config) {
      const {flatOptions, flatConfigPath} = await resolveXoConfig({
        ...this.options,
      });
      this.config = flatOptions;
      this.flatConfigPath = flatConfigPath;
    }

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

    let ignores: string[] = [];

    if (typeof this.options.ignores === 'string') {
      ignores = arrify(this.options.ignores);
    } else if (Array.isArray(this.options.ignores)) {
      ignores = this.options.ignores;
    }

    const inputOptions = [...this.config];

    if (ignores.length > 0) {
      inputOptions.push({ignores});
    }

    if (!this.overrideConfig) {
      const overrideConfig = await createConfig(
        [...this.config],
        this.options.tsconfig,
      );
      this.overrideConfig = overrideConfig;
    }

    const cacheLocation = path.join(
      findCacheLocation(this.options.cwd),
      'flat-xo-cache.json',
    );

    // @ts-expect-error - ESLint is not exported
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.eslint = new FlatESLint({
      cwd: this.options.cwd,
      overrideConfig: this.overrideConfig,
      overrideConfigFile: true,
      globInputPaths: false,
      warnIgnored: false,
      cache: true,
      cacheLocation,
    });

    return this.eslint!;
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

  async initFixableEslint(): Promise<ESLint> {
    this.options.cwd ||= process.cwd();

    if (!path.isAbsolute(this.options.cwd)) {
      this.options.cwd = path.resolve(process.cwd(), this.options.cwd);
    }

    if (!this.config) {
      const {flatOptions, flatConfigPath} = await resolveXoConfig({
        ...this.options,
      });
      this.config = flatOptions;
      this.configPath = flatConfigPath;
    }

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

    let ignores: string[] = [];

    if (typeof this.options.ignores === 'string') {
      ignores = arrify(this.options.ignores);
    } else if (Array.isArray(this.options.ignores)) {
      ignores = this.options.ignores;
    }

    const inputOptions = [...this.config];

    if (ignores.length > 0) {
      inputOptions.push({ignores});
    }

    if (!this.overrideConfig) {
      const overrideConfig = await createConfig(
        [...this.config],
        this.options.tsconfig,
      );
      this.overrideConfig = overrideConfig;
    }

    const cacheLocation = path.join(
      findCacheLocation(this.options.cwd),
      'flat-xo-cache.json',
    );

    // @ts-expect-error - ESLint is not exported
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const eslint = new FlatESLint({
      cwd: this.options.cwd,
      overrideConfig: this.overrideConfig,
      overrideConfigFile: true,
      globInputPaths: false,
      cache: true,
      cacheLocation,
      fix: true,
    });

    this.fixableEslint = eslint; // eslint-disable-line @typescript-eslint/no-unsafe-assignment

    return eslint; // eslint-disable-line @typescript-eslint/no-unsafe-return
  }

  async lintText(
    code: string,
    lintTextOptions: LintTextOptions,
  ): Promise<XoLintResult> {
    const {filePath, warnIgnored, /* forceInitialize, */ fix} = lintTextOptions;

    this.eslint ||= await this.initEslint();

    this.fixableEslint ||= await this.initFixableEslint();

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
      // @ts-expect-error - IDK whats going on here
      report = FlatESLint.getErrorResults(report); // eslint-disable-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
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
