import path from 'node:path';
import fs from 'node:fs/promises';
import url from 'node:url';
import test from 'ava';
import {XO} from '../../../lib/index.js';

const __dirname = path.dirname(url.fileURLToPath(new URL(import.meta.url)));

test('js file > semi', async t => {
	const cwd = path.resolve(__dirname, '..', '..', 'fixtures', 'flat-config', 'semi');
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

test('ts file > semi', async t => {
	const cwd = path.resolve(__dirname, '..', '..', 'fixtures', 'flat-config', 'semi');
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
