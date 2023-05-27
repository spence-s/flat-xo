import path from 'node:path';
import url from 'node:url';
import test from 'ava';
import {XO} from '../../../lib/index.js';

const __dirname = path.dirname(url.fileURLToPath(new URL(import.meta.url)));

test('js file > space', async t => {
	const cwd = path.resolve(__dirname, '..', '..', 'fixtures', 'flat-config', 'space');
	const xo = new XO({cwd});
	const {results} = await xo.lintFiles('space.js');
	t.is(results.length, 1);
	t.is(results?.[0]?.messages?.[0]?.messageId, 'wrongIndentation');
	t.is(results?.[0]?.messages?.[0]?.ruleId, 'indent');
});

test('ts file > space', async t => {
	const cwd = path.resolve(__dirname, '..', '..', 'fixtures', 'flat-config', 'space');
	const xo = new XO({cwd});
	const {results} = await xo.lintFiles('space.ts');
	t.is(results.length, 1);
	t.is(results?.[0]?.messages?.[0]?.messageId, 'wrongIndentation');
	t.is(results?.[0]?.messages?.[0]?.ruleId, '@typescript-eslint/indent');
});
