import type {FlatESLintConfigItem} from 'eslint-define-config';
import {type ESLint, type Rule} from 'eslint';

export type BaseXoConfig = {
  semicolon: boolean;
  prettier: boolean;
  tsconfig?: string;
};

export type CliOptions = BaseXoConfig & {
  space: boolean | number | string;
  cwd: string;
  filePath?: string;
  tsConfigPath?: string;
};

export type LintTextOptions = CliOptions & {warnIgnored?: boolean};

export type XoConfigItem = FlatESLintConfigItem & Partial<CliOptions>;

export type XoLintResult = {
  results: ESLint.LintResult[];
  rulesMeta: Rule.RuleMetaData;
};
