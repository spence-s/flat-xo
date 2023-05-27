import {type FlatESLintConfig} from 'eslint-define-config';
// eslint-disable-next-line import/no-named-default
import {default as test} from 'ava';
// eslint-disable-next-line import/no-named-default
import {default as createConfig} from '../lib/create-eslint-config.js';

const findRule = (flatConfig: FlatESLintConfig[], ruleId: string) => {
	const conf = [...flatConfig].reverse().find(config =>
		typeof config !== 'string' && config?.rules?.[ruleId],
	);

	if (typeof conf === 'string') {
		return undefined;
	}

	return conf?.rules?.[ruleId];
};

test('base config snapshot', async t => {
	const flatConfig = await createConfig();

	t.is(flatConfig.length, 8);
	t.snapshot(flatConfig);
});

test('empty config snapshot', async t => {
	const flatConfig = await createConfig([]);

	t.is(flatConfig.length, 8);
	t.snapshot(flatConfig);
});

test('config with rules snapshot', async t => {
	const flatConfig = await createConfig([{rules: {'no-console': 'error'}}]);

	t.is(findRule(flatConfig, 'no-console'), 'error');

	t.is(flatConfig.length, 9);
	t.snapshot(flatConfig);
});
