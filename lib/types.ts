import {type FlatESLintConfig} from 'eslint-define-config';
import {type ESLint, type Rule} from 'eslint';

export type Space = boolean | number | string | undefined;

export type Normalize<Type> = {
  [Property in keyof Type as `${string & Property}s`]: Type[Property];
} & Type;

export type CliOptions = {
  fix?: boolean;
  reporter?: string;
  env?: string[];
  global?: string[];
  ignores?: string[];
  space?: Space;
  semicolon?: boolean;
  cwd?: string;
  version?: boolean;
  printConfig?: boolean;
};

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
  ezTs?: boolean;
};

export type GlobalOptions = XoOptions & FlatESLintConfig;

export type LintTextOptions = LintOptions & {
  warnIgnored?: boolean;
  forceInitialize?: boolean;
  fix?: boolean;
};

export type XoConfigItem = FlatESLintConfig & Partial<LintOptions>;

export type FlatXoConfig = XoConfigItem[];

export type XoLintResult = {
  results: ESLint.LintResult[];
  rulesMeta: Rule.RuleMetaData;
};
