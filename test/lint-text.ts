import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';
import test from 'ava';
import {XO} from '../lib/index.js';

const __dirname = path.dirname(url.fileURLToPath(new URL(import.meta.url)));

const readFile = async (_path: string) =>
	fs.readFile(_path, {encoding: 'utf8'});

test('no config > js', async t => {
	const cwd = path.resolve(__dirname, 'fixtures', 'no-config', 'no-config-js');
	const filePath = path.join(cwd, 'no-semi.js');
	const {results} = await new XO({cwd}).lintText(await readFile(filePath), {
		filePath,
	});

	t.is(results.length, 1);
	t.is(results?.[0]?.messages?.[0]?.messageId, 'missingSemi');
});

test('no config > ts', async t => {
	const cwd = path.resolve(__dirname, 'fixtures', 'no-config', 'no-config-ts');
	const filePath = path.join(cwd, 'no-semi.ts');
	const {results} = await new XO({cwd}).lintText(await readFile(filePath), {
		filePath,
	});

	t.is(results.length, 1);
	t.is(results?.[0]?.messages?.[0]?.messageId, 'missingSemi');
});

test('flat config > semi > js', async t => {
	const cwd = path.resolve(__dirname, 'fixtures', 'flat-config', 'semi');
	const filePath = path.join(cwd, 'semi.js');

	const xo = new XO({cwd});

	const {results} = await xo.lintText(
		await fs.readFile(filePath, 'utf8'),
		{filePath},
	);

	t.is(results.length, 1);
	t.is(results?.[0]?.messages?.[0]?.messageId, 'extraSemi');
	t.is(results?.[0]?.messages?.[0]?.ruleId, 'semi');
});

test('flat config > semi > ts', async t => {
	const cwd = path.resolve(__dirname, 'fixtures', 'flat-config', 'semi');
	const filePath = path.join(cwd, 'semi.ts');

	const xo = new XO({cwd});

	const {results} = await xo.lintText(
		await fs.readFile(filePath, 'utf8'),
		{filePath},
	);

	t.is(results.length, 1);
	t.is(results?.[0]?.messages?.[0]?.messageId, 'extraSemi');
	t.is(results?.[0]?.messages?.[0]?.ruleId, '@typescript-eslint/semi');
});

test('flat config > space > js', async t => {
	const cwd = path.resolve(__dirname, 'fixtures', 'flat-config', 'space');
	const filePath = path.join(cwd, 'space.js');

	const xo = new XO({cwd});

	const {results} = await xo.lintText(
		await fs.readFile(filePath, 'utf8'),
		{filePath},
	);

	t.is(results.length, 1);
	t.is(results?.[0]?.messages?.[0]?.messageId, 'wrongIndentation');
	t.is(results?.[0]?.messages?.[0]?.ruleId, 'indent');
});

test('flat config > space > ts', async t => {
	const cwd = path.resolve(__dirname, 'fixtures', 'flat-config', 'space');
	const filePath = path.join(cwd, 'space.ts');

	const xo = new XO({cwd});

	const {results} = await xo.lintText(
		await fs.readFile(filePath, 'utf8'),
		{filePath},
	);

	t.is(results.length, 1);
	t.is(results?.[0]?.messages?.[0]?.messageId, 'wrongIndentation');
	t.is(results?.[0]?.messages?.[0]?.ruleId, '@typescript-eslint/indent');
});
