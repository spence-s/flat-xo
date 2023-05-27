import path from 'node:path';
import fs from 'node:fs/promises';
import url from 'node:url';
import test from 'ava';
import {XO} from '../../../lib/index.js';

const __dirname = path.dirname(url.fileURLToPath(new URL(import.meta.url)));

test('js file > space', async t => {
	const cwd = path.resolve(__dirname, '..', '..', 'fixtures', 'flat-config', 'space');
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

test('ts file > space', async t => {
	const cwd = path.resolve(__dirname, '..', '..', 'fixtures', 'flat-config', 'space');
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
