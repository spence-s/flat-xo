
import arrify from 'arrify';
import {type FlatESLintConfig} from 'eslint-define-config';
import {
  ALL_FILES_GLOB,
} from '../constants.js';
import {type XoConfigItem} from '../types.js';

export const xoToEslintConfigItem = (xoConfig: XoConfigItem): FlatESLintConfig => {
  const eslintConfig: FlatESLintConfig = {};
  eslintConfig.settings &&= xoConfig.settings;
  eslintConfig.plugins &&= xoConfig.plugins;
  eslintConfig.languageOptions &&= xoConfig.languageOptions;
  eslintConfig.files ||= arrify(xoConfig.files ?? ALL_FILES_GLOB);
  eslintConfig.ignores &&= arrify(xoConfig.ignores);

  return eslintConfig;
};
