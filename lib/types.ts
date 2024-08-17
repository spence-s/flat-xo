import {type FlatESLintConfig} from 'eslint-define-config';
import {type ESLint, type Rule} from 'eslint';

export type Space = boolean | number | string | undefined;

export type ConfigOptions = {
  /**
   * Use spaces for indentation.
   * Tabs are used if the value is `false`, otherwise the value is the number of spaces to use or true, the default number of spaces is 2.
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
   * Files to ignore, can be a glob or array of globs.
   */
  ignores?: string | string[];
};

export type LintOptions = ConfigOptions & {
  /**
   * The current working directory to use for relative paths.
   */
  cwd?: string;
  /**
   * The path to the file being linted.
   */
  filePath?: string;
  /**
   * Write fixes to the files.
   */
  fix?: boolean;
};

export type LintTextOptions = LintOptions & {
  warnIgnored?: boolean;
};

export type XoConfigItem = ConfigOptions & Omit<FlatESLintConfig, 'files' | 'ignores'> & {
  /**
     * An array of glob patterns indicating the files that the configuration object should apply to. If not specified, the configuration object applies to all files.
     *
     * @see [Ignore Patterns](https://eslint.org/docs/latest/user-guide/configuring/configuration-files-new#excluding-files-with-ignores)
     */
  files?: string | string[] | undefined;
};

export type FlatXoConfig = XoConfigItem[];

export type XoLintResult = {
  results: ESLint.LintResult[];
  rulesMeta: Rule.RuleMetaData;
};
