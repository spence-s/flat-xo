import type {ESLint, Linter} from 'eslint';
import type {
  FlatESLintConfigItem,
  PredefinedConfig,
  FlatESLintConfig,
} from 'eslint-define-config';

declare global {
  namespace XO {
    export type Config = {
      space?: boolean | number;
      env?: string[];
      extends?: string[];
      global?: string[];
      nodeVersion?: string | boolean;
      ignore?: string[];
      plugins?: string[];
      rules?: Record<string, unknown>;
      semicolon?: boolean;
      prettier?: boolean;
      parser?: string;
      processor?: string;
      webpack?: boolean | Record<string, unknown>;
    };

    export type FlatConfig =
      | PredefinedConfig // eslint-disable-line @typescript-eslint/no-redundant-type-constituents
      | (Omit<FlatESLintConfigItem, 'settings'> & {
          space?: boolean | number;
          prettier?: boolean;
          env?: string[];
          settings?: Record<string, unknown>;
        });

    export type CliOptions = {
      cwd?: string;
      reporter?: string;
      prettier?: boolean;
      space?: boolean | number | string;
      quiet?: boolean;
      fix?: boolean;
      open?: boolean;
      printConfig?: boolean;
      warnIgnored?: boolean;
      semi?: boolean;
      nodeVersion?: boolean | string;
      stdin?: string | boolean;
      stdinFilename?: string;
      version?: string;
      filePath?: string;
      env?: string[];
      extend?: string[];
      global?: string[];
      ignore?: string[];
      plugin?: string[];
    };

    export type LintResult = {
      results: ESLint.LintResult[];
      rulesMeta: ESLint.LintResultData['rulesMeta'];
      filePath: string;
      messages: Linter.LintMessage[];
      suppressedMessages: Linter.SuppressedLintMessage[];
      errorCount: number;
      fatalErrorCount: number;
      warningCount: number;
      fixableErrorCount: number;
      fixableWarningCount: number;
      output?: string | undefined;
      source?: string | undefined;
      usedDeprecatedRules: DeprecatedRuleUse[];
    };
  }
}
