import test from 'ava';
import createConfig from '../lib/create-eslint-config.js';
import {getJsRule, getTsRule} from './helpers/get-rule.js';

test('base config rule tests with snapshot', async (t) => {
  const flatConfig = await createConfig();

  t.log(flatConfig);

  t.deepEqual(getJsRule(flatConfig, 'indent'), [
    'error',
    'tab',
    {SwitchCase: 1},
  ]);
  t.deepEqual(getJsRule(flatConfig, 'semi'), ['error', 'always']);
  t.deepEqual(getJsRule(flatConfig, 'quotes'), ['error', 'single']);

  t.deepEqual(getTsRule(flatConfig, '@typescript-eslint/indent'), [
    'error',
    'tab',
    {SwitchCase: 1},
  ]);
  t.deepEqual(getTsRule(flatConfig, '@typescript-eslint/semi'), [
    'error',
    'always',
  ]);
  t.deepEqual(getTsRule(flatConfig, '@typescript-eslint/quotes'), [
    'error',
    'single',
  ]);
});

test('empty config rule tests with snapshot', async (t) => {
  const flatConfig = await createConfig([]);

  t.deepEqual(getJsRule(flatConfig, 'indent'), [
    'error',
    'tab',
    {SwitchCase: 1},
  ]);
  t.deepEqual(getJsRule(flatConfig, 'semi'), ['error', 'always']);
  t.deepEqual(getJsRule(flatConfig, 'quotes'), ['error', 'single']);

  t.deepEqual(getTsRule(flatConfig, '@typescript-eslint/indent'), [
    'error',
    'tab',
    {SwitchCase: 1},
  ]);
  t.deepEqual(getTsRule(flatConfig, '@typescript-eslint/semi'), [
    'error',
    'always',
  ]);
  t.deepEqual(getTsRule(flatConfig, '@typescript-eslint/quotes'), [
    'error',
    'single',
  ]);
});

test('config with space option', async (t) => {
  const flatConfig = await createConfig([{space: true}]);

  t.deepEqual(getJsRule(flatConfig, 'indent'), ['error', 2, {SwitchCase: 1}]);
  t.deepEqual(getTsRule(flatConfig, '@typescript-eslint/indent'), [
    'error',
    2,
    {SwitchCase: 1},
  ]);
});

test('config with semi false option', async (t) => {
  const flatConfig = await createConfig([{semicolon: false}]);

  t.deepEqual(getJsRule(flatConfig, 'semi'), ['error', 'never']);
  t.deepEqual(getTsRule(flatConfig, '@typescript-eslint/semi'), [
    'error',
    'never',
  ]);
});

test('config with rules snapshot', async (t) => {
  const flatConfig = await createConfig([{rules: {'no-console': 'error'}}]);

  t.is(getJsRule(flatConfig, 'no-console'), 'error');
});
