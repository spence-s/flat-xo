import path from 'node:path';
import url from 'node:url';
import test from 'ava';
import Xo from '../../../lib/class.js';

const __dirname = path.dirname(url.fileURLToPath(new URL(import.meta.url)));

test.skip('js file > semi', async t => {
	const cwd = path.resolve(__dirname, '..', '..', 'fixtures', 'flat-config', 'semi');

	const {results} = await new Xo({cwd}).lintFiles('extraSemi.js');

	t.log(results);

	t.is(results.length, 1);
	t.is(results?.[0]?.messages?.[0]?.messageId, 'extraSemi');
});

test.skip('ts file > semi', async t => {
	const cwd = path.resolve(__dirname, '..', '..', 'fixtures', 'flat-config', 'semi');

	const {results} = await new Xo({cwd}).lintFiles('extraSemi.ts');

	t.log(results);

	t.is(results.length, 1);
	t.is(results?.[0]?.messages?.[0]?.messageId, 'extraSemi');
});

test.skip('js + ts file > semi', async t => {
	const cwd = path.resolve(__dirname, '..', '..', 'fixtures', 'flat-config', 'semi');

	const {results} = await new Xo({cwd}).lintFiles();

	t.is(results.length, 2);
	t.is(results?.[0]?.messages?.[0]?.messageId, 'extraSemi');
	t.is(results?.[1]?.messages?.[0]?.messageId, 'extraSemi');
});
