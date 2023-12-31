import {type FlatESLintConfig} from 'eslint-define-config';
import {JS_FILES_GLOB, TS_FILES_GLOB} from '../../lib/constants.js';

/**
 * find the rule applied to js files
 *
 * @param flatConfig
 * @param ruleId
 */
export const getJsRule = (flatConfig: FlatESLintConfig[], ruleId: string) => {
	const conf = [...flatConfig].reverse().find(config =>
		typeof config !== 'string' && config?.rules?.[ruleId] && config.files?.includes(JS_FILES_GLOB),
	);

	if (typeof conf === 'string') {
		return undefined;
	}

	return conf?.rules?.[ruleId];
};

/**
 * find the rule applied to ts files
 *
 * @param flatConfig
 * @param ruleId
 */
export const getTsRule = (flatConfig: FlatESLintConfig[], ruleId: string) => {
	const conf = [...flatConfig].reverse().find(config =>
		typeof config !== 'string' && config?.rules?.[ruleId] && config.files?.includes(TS_FILES_GLOB),
	);

	if (typeof conf === 'string') {
		return undefined;
	}

	return conf?.rules?.[ruleId];
};

