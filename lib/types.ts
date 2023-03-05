import type {FlatESLintConfigItem} from 'eslint-define-config';

export type BaseXoConfig = {
  semicolon: boolean;
  prettier: boolean;
  tsconfig?: string;
  cwd: string;
};

export type CliOptions = BaseXoConfig & {
  space: boolean | number | string;
};

export type XoConfigItem = FlatESLintConfigItem & Partial<CliOptions>;
