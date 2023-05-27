import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';
import test from 'ava';
import Xo from '../../lib/index.js';

const __dirname = path.dirname(url.fileURLToPath(new URL(import.meta.url)));

const readFile = async (_path: string) =>
	fs.readFile(_path, {encoding: 'utf8'});

test('js file', async t => {
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

test('ts file', async t => {
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

