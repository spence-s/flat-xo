import path from 'node:path';
import url from 'node:url';
import test from 'ava';
import {XO} from '../../lib/index.js';

const __dirname = path.dirname(url.fileURLToPath(new URL(import.meta.url)));

test('js file', async t => {
	const cwd = path.resolve(
		__dirname,
		'..',
		'fixtures',
		'no-config',
		'no-config-js',
	);
	const {results} = await new XO({cwd}).lintFiles();
	t.is(results.length, 1);
	t.is(results?.[0]?.messages?.[0]?.messageId, 'missingSemi');
});

test('ts file', async t => {
	const cwd = path.resolve(
		__dirname,
		'..',
		'fixtures',
		'no-config',
		'no-config-ts',
	);
	const {results} = await new XO({cwd}).lintFiles('no-semi.ts');
	t.is(results.length, 1);
	t.is(results?.[0]?.messages?.[0]?.messageId, 'missingSemi');
});

test('js + ts file', async t => {
	const cwd = path.resolve(__dirname, '..', 'fixtures', 'no-config');
	const {results} = await new XO({cwd}).lintFiles('**/no-semi.*');
	t.is(results.length, 2);
	t.is(results?.[0]?.messages?.[0]?.messageId, 'missingSemi');
	t.is(results?.[1]?.messages?.[0]?.messageId, 'missingSemi');
});
