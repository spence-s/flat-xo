import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';
import test from 'ava';
import Xo from '../../lib/class.js';

const __dirname = path.dirname(url.fileURLToPath(new URL(import.meta.url)));

const readFile = async (_path: string) =>
	fs.readFile(_path, {encoding: 'utf8'});

test('class: lints js file with no config', async t => {
	const cwd = path.resolve(
		__dirname,
		'..',
		'fixtures',
		'no-config',
		'no-config-js',
	);

	const filePath = path.join(cwd, 'no-semi.js');

	const {results} = await new Xo({cwd}).lintText(await readFile(filePath), {
		filePath,
	});

	t.is(results.length, 1);
	t.is(results?.[0]?.messages?.[0]?.messageId, 'missingSemi');
});

test('class: lints ts file with no config', async t => {
	const cwd = path.resolve(
		__dirname,
		'..',
		'fixtures',
		'no-config',
		'no-config-ts',
	);
	const filePath = path.join(cwd, 'no-semi.ts');

	const {results} = await new Xo({cwd}).lintText(await readFile(filePath), {
		filePath,
	});

	t.is(results.length, 1);
	t.is(results?.[0]?.messages?.[0]?.messageId, 'missingSemi');
});

// eslint-disable-next-line ava/no-skip-test
test.skip('class: lints js and ts files simultaneously with no config', async t => {
	const cwd = path.resolve(__dirname, '..', 'fixtures', 'no-config');

	const filePath = path.join(cwd, 'no-semi.js');

	const {results} = await new Xo({cwd}).lintText(await readFile(filePath), {
		filePath,
	});

	t.is(results.length, 2);
	t.is(results?.[0]?.messages?.[0]?.messageId, 'missingSemi');
	t.is(results?.[1]?.messages?.[0]?.messageId, 'missingSemi');
});
