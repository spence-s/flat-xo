import path from 'node:path';
import url from 'node:url';
import test from 'ava';
import {XO} from '../lib/index.js';

const __dirname = path.dirname(url.fileURLToPath(new URL(import.meta.url)));

test('no config > js', async (t) => {
  const cwd = path.resolve(__dirname, 'fixtures', 'no-config', 'no-config-js');
  const {results} = await new XO({cwd}).lintFiles('no-semi.js');

  t.is(results?.[0]?.messages?.[0]?.messageId, 'missingSemi');
});

test('no config > ts', async (t) => {
  const cwd = path.resolve(__dirname, 'fixtures', 'no-config', 'no-config-ts');
  const {results} = await new XO({cwd}).lintFiles('no-semi.ts');
  t.is(results.length, 1);
  t.is(results?.[0]?.messages?.[0]?.messageId, 'missingSemi');
});

test('no config > js + ts', async (t) => {
  const cwd = path.resolve(__dirname, 'fixtures', 'no-config');
  const {results} = await new XO({cwd}).lintFiles('*/no-semi.{js,ts}');
  t.is(results.length, 2);
  t.is(results?.[0]?.messages?.[0]?.messageId, 'missingSemi');
  t.is(results?.[1]?.messages?.[0]?.messageId, 'missingSemi');
});

test('flat config > semi > js', async (t) => {
  const cwd = path.resolve(__dirname, 'fixtures', 'flat-config', 'semi');
  const xo = new XO({cwd});
  const {results} = await xo.lintFiles('semi.js');
  t.is(results.length, 1);
  t.is(results?.[0]?.messages?.[0]?.messageId, 'extraSemi');
});

test('flat config > semi > ts', async (t) => {
  const cwd = path.resolve(__dirname, 'fixtures', 'flat-config', 'semi');
  const {results} = await new XO({cwd}).lintFiles('semi.ts');
  t.is(results.length, 1);
  t.is(results?.[0]?.messages?.[0]?.messageId, 'extraSemi');
});

test('flat config > semi > ts + js', async (t) => {
  const cwd = path.resolve(__dirname, 'fixtures', 'flat-config', 'semi');
  const {results} = await new XO({cwd}).lintFiles('semi.*');
  t.is(results.length, 2);
  t.is(results?.[0]?.messages?.[0]?.messageId, 'extraSemi');
  t.is(results?.[1]?.messages?.[0]?.messageId, 'extraSemi');
});

test('flat config > space > js', async (t) => {
  const cwd = path.resolve(__dirname, 'fixtures', 'flat-config', 'space');
  const xo = new XO({cwd});
  const {results} = await xo.lintFiles('space.js');
  t.is(results.length, 1);
  t.is(results?.[0]?.messages?.[0]?.messageId, 'wrongIndentation');
  t.is(results?.[0]?.messages?.[0]?.ruleId, 'indent');
});

test('flat config > space > ts', async (t) => {
  const cwd = path.resolve(__dirname, 'fixtures', 'flat-config', 'space');
  const xo = new XO({cwd});
  const {results} = await xo.lintFiles('space.ts');
  t.is(results.length, 1);
  t.is(results?.[0]?.messages?.[0]?.messageId, 'wrongIndentation');
  t.is(results?.[0]?.messages?.[0]?.ruleId, '@typescript-eslint/indent');
});

test('flat config > space > js + ts', async (t) => {
  const cwd = path.resolve(__dirname, 'fixtures', 'flat-config', 'space');
  const {results} = await new XO({cwd}).lintFiles('space.*');
  t.is(results.length, 2);
  t.is(results?.[0]?.messages?.[0]?.messageId, 'wrongIndentation');
  t.is(results?.[1]?.messages?.[0]?.messageId, 'wrongIndentation');
});
