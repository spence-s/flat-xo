import {type FlatESLintConfig} from 'eslint-define-config';
import {type ESLint, type Rule} from 'eslint';

export type Space = boolean | number | string | undefined;

export type Normalize<Type> = {
  [Property in keyof Type as `${string & Property}s`]: Type[Property];
} & Type;

/**
 * Xo options that can be passed to the CLI or parsed from a config file.
 */
export type XoOptions = {
  /**
   * Use spaces or tabs for indentation.
   * Tabs are used if the value is `false`, otherwise the
   * value is the number of spaces to use or true, the default number of spaces is 2.
   */
  space?: Space;
  /**
   * Use semicolons at the end of statements or error for semi-colon usage.
   */
  semicolon?: boolean;
  /**
   * Use Prettier to format code.
   */
  prettier?: boolean;
  /**
   * Path to your tsconfg.json file.
   */
  tsconfig?: string;
  /**
   * Files to ignore, can be a glob or array of globs.
   */
  ignores?: string | string[];
};

export type LintOptions = XoOptions & {
  cwd?: string;
  filePath?: string;
  fix?: boolean;
};

export type LintTextOptions = LintOptions & {
  warnIgnored?: boolean;
};

export type XoConfigItem = FlatESLintConfig & Partial<LintOptions>;

export type FlatXoConfig = XoConfigItem[];

export type XoLintResult = {
  results: ESLint.LintResult[];
  rulesMeta: Rule.RuleMetaData;
};
