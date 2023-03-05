declare module 'eslint/use-at-your-own-risk' {
  import {type FlatESLintConfig} from 'eslint-define-config';
  import {type ESLint} from 'eslint';

  type FlatESLintOptions = {
    allowInlineConfig?: boolean;
    baseConfig?: FlatESLintConfig[];
    cache?: boolean;
    cacheLocation?: string;
    cacheStrategy?: 'metadata' | 'content';
    cwd?: string;
    errorOnUnmatchedPattern?: boolean;
    fix?: boolean | (() => boolean);
    fixTypes?: string[];
    globInputPaths?: boolean;
    ignore?: boolean;
    ignorePatterns?: string[];
    overrideConfig?: FlatESLintConfig[];
    overrideConfigFile?: boolean | string;
    plugins?: Record<string, ESLint.Plugin>;
    reportUnusedDisableDirectives?: 'error' | 'warn' | 'off';
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
    constructor(options?: FlatESLintOptions);
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
}

declare module 'eslint-plugin-ava' {
  import {type ESLint} from 'eslint';

  const plugin: ESLint.Plugin;
  export default plugin;
}

declare module 'eslint-plugin-unicorn' {
  import {type ESLint} from 'eslint';

  const plugin: ESLint.Plugin;
  export default plugin;
}

declare module 'eslint-plugin-import' {
  import {type ESLint} from 'eslint';

  const plugin: ESLint.Plugin;
  export default plugin;
}

declare module 'eslint-plugin-n' {
  import {type ESLint} from 'eslint';

  const plugin: ESLint.Plugin;
  export default plugin;
}

declare module 'eslint-plugin-eslint-comments' {
  import {type ESLint} from 'eslint';

  const plugin: ESLint.Plugin;
  export default plugin;
}

declare module 'eslint-plugin-no-use-extend-native' {
  import {type ESLint} from 'eslint';

  const plugin: ESLint.Plugin;
  export default plugin;
}

declare module 'eslint-plugin-prettier' {
  import {type ESLint} from 'eslint';

  const plugin: ESLint.Plugin;
  export default plugin;
}

declare module 'eslint-config-xo-typescript' {
  import {type ESLintConfig} from 'eslint-define-config';

  const config: ESLintConfig;
  export default config;
}

declare module 'eslint-config-xo' {
  import {type ESLintConfig} from 'eslint-define-config';

  const config: ESLintConfig;
  export default config;
}

declare module 'eslint-config-prettier' {
  import {type ESLintConfig} from 'eslint-define-config';

  const config: ESLintConfig;
  export default config;
}
