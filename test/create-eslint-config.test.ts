import test from 'ava';
import createConfig from '../lib/create-eslint-config.js';
import {getJsRule, getTsRule} from './helpers/get-rule.js';

test('base config rule tests with snapshot', async t => {
	const flatConfig = await createConfig();
	t.is(flatConfig.length, 8);

	t.deepEqual(getJsRule(flatConfig, 'indent'), ['error', 'tab', {SwitchCase: 1}]);
	t.deepEqual(getJsRule(flatConfig, 'semi'), ['error', 'always']);
	t.deepEqual(getJsRule(flatConfig, 'quotes'), ['error', 'single']);

	t.deepEqual(getTsRule(flatConfig, '@typescript-eslint/indent'), ['error', 'tab', {SwitchCase: 1}]);
	t.deepEqual(getTsRule(flatConfig, '@typescript-eslint/semi'), ['error', 'always']);
	t.deepEqual(getTsRule(flatConfig, '@typescript-eslint/quotes'), ['error', 'single']);

	t.snapshot(flatConfig);
});

test('empty config rule tests with snapshot', async t => {
	const flatConfig = await createConfig([]);
	t.is(flatConfig.length, 8);

	t.deepEqual(getJsRule(flatConfig, 'indent'), ['error', 'tab', {SwitchCase: 1}]);
	t.deepEqual(getJsRule(flatConfig, 'semi'), ['error', 'always']);
	t.deepEqual(getJsRule(flatConfig, 'quotes'), ['error', 'single']);

	t.deepEqual(getTsRule(flatConfig, '@typescript-eslint/indent'), ['error', 'tab', {SwitchCase: 1}]);
	t.deepEqual(getTsRule(flatConfig, '@typescript-eslint/semi'), ['error', 'always']);
	t.deepEqual(getTsRule(flatConfig, '@typescript-eslint/quotes'), ['error', 'single']);

	t.snapshot(flatConfig);
});

test('config with space option', async t => {
	const flatConfig = await createConfig([{space: true}]);

	t.is(flatConfig.length, 10);
	t.deepEqual(getJsRule(flatConfig, 'indent'), ['error', 2, {SwitchCase: 1}]);
	t.deepEqual(getTsRule(flatConfig, '@typescript-eslint/indent'), ['error', 2, {SwitchCase: 1}]);
	t.snapshot(flatConfig);
});

test('config with semi false option', async t => {
	const flatConfig = await createConfig([{semicolon: false}]);

	t.is(flatConfig.length, 10);
	t.deepEqual(getJsRule(flatConfig, 'semi'), ['error', 'never']);
	t.deepEqual(getTsRule(flatConfig, '@typescript-eslint/semi'), ['error', 'never']);
	t.snapshot(flatConfig);
});

test('config with rules snapshot', async t => {
	const flatConfig = await createConfig([{rules: {'no-console': 'error'}}]);

	t.is(flatConfig.length, 9);
	t.is(getJsRule(flatConfig, 'no-console'), 'error');
	t.snapshot(flatConfig);
});
