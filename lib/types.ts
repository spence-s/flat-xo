import type {FlatESLintConfigItem} from 'eslint-define-config';

export type BaseXoConfig = {
  space: boolean;
  semicolon: boolean;
  prettier: boolean;
  tsconfig: string;
  cwd: string;
};

export type XoConfigItem = FlatESLintConfigItem & Partial<BaseXoConfig>;
