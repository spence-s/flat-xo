import {type FlatESLintConfig} from 'eslint-define-config';
import {type FlatXoConfig, type LintOptions} from './types.js';
import {XO} from './xo.js';

export type WorkerOptions = {
  eslintConfig: FlatESLintConfig[];
  xoConfig: FlatXoConfig;
  options: LintOptions;
  ignores: string | string[];
  flatConfigPath: string;
  cacheLocation: string;
  files: string[];
};

const worker = async ({
  eslintConfig,
  xoConfig,
  ignores,
  options,
  flatConfigPath,
  cacheLocation,
  files,
}: WorkerOptions) => {
  const xo = new XO(options);
  xo.flatConfigPath = flatConfigPath;
  xo.xoConfig = xoConfig;
  xo.cacheLocation = cacheLocation;
  xo.ignores = ignores;
  xo.eslintConfig = eslintConfig;

  await xo.lintFiles(files);
};

export default worker;
