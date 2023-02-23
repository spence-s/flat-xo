import {type ESLint, type Linter} from 'eslint';

export type CliOptions = {
  cwd: string;
  reporter: string;
  prettier: boolean;
  space: boolean | number | string;
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

export type XoResults = {
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
