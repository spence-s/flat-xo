import type {FlatESLintConfigItem} from 'eslint-define-config';
import {type ESLint, type Rule} from 'eslint';

export type BaseXoConfig = {
  space?: boolean | number | string;
  semicolon?: boolean;
  prettier?: boolean;
  tsconfig?: string;
  ignores?: string | string[];
};

export type CliOptions = BaseXoConfig & {
  cwd?: string;
  filePath?: string;
};

export type GlobalOptions = Partial<BaseXoConfig> & FlatESLintConfigItem;

export type LintTextOptions = CliOptions & {warnIgnored?: boolean};

export type XoConfigItem = FlatESLintConfigItem & Partial<CliOptions>;

export type XoLintResult = {
  results: ESLint.LintResult[];
  rulesMeta: Rule.RuleMetaData;
};
