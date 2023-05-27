import path from 'node:path';
import url from 'node:url';
import test from 'ava';
import {XO} from '../../../lib/index.js';

const __dirname = path.dirname(url.fileURLToPath(new URL(import.meta.url)));

test('js file > semi', async t => {
	const cwd = path.resolve(__dirname, '..', '..', 'fixtures', 'flat-config', 'semi');

	const xo = new XO({cwd});

	const {results} = await xo.lintFiles('semi.js');

	t.is(results.length, 1);
	t.is(results?.[0]?.messages?.[0]?.messageId, 'extraSemi');
});

test('ts file > semi', async t => {
	const cwd = path.resolve(__dirname, '..', '..', 'fixtures', 'flat-config', 'semi');

	const {results} = await new XO({cwd}).lintFiles('semi.ts');

	t.is(results.length, 1);
	t.is(results?.[0]?.messages?.[0]?.messageId, 'extraSemi');
});

test('js + ts file > semi', async t => {
	const cwd = path.resolve(__dirname, '..', '..', 'fixtures', 'flat-config', 'semi');

	const {results} = await new XO({cwd}).lintFiles('semi.*');

	t.is(results.length, 2);
	t.is(results?.[0]?.messages?.[0]?.messageId, 'extraSemi');
	t.is(results?.[1]?.messages?.[0]?.messageId, 'extraSemi');
});
