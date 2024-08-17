import {type FlatESLintConfig} from 'eslint-define-config';
import {
  ALL_FILES_GLOB,
  JS_FILES_GLOB,
  TS_FILES_GLOB,
} from '../../lib/constants.js';

/**
 * find the rule applied to js files
 *
 * @param flatConfig
 * @param ruleId
 */
export const getJsRule = (flatConfig: FlatESLintConfig[], ruleId: string) => {
  const config = [...flatConfig].reverse().find(config =>
    (typeof config !== 'string'
    && config?.rules?.[ruleId]

    && config.files?.includes(ALL_FILES_GLOB))
    || config.files?.includes(JS_FILES_GLOB));

  if (typeof config === 'string') {
    return undefined;
  }

  return config?.rules?.[ruleId];
};

/**
 * find the rule applied to ts files
 *
 * @param flatConfig
 * @param ruleId
 */
export const getTsRule = (flatConfig: FlatESLintConfig[], ruleId: string) => {
  const config = [...flatConfig]
    .reverse()
    .find(config =>
      typeof config !== 'string'
      && config?.rules?.[ruleId]
      && config.files?.includes(TS_FILES_GLOB));

  if (typeof config === 'string') {
    return undefined;
  }

  return config?.rules?.[ruleId];
};
