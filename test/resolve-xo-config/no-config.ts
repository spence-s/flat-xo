import url from 'node:url';
import path from 'node:path';
import test from 'ava';
import resolveXoConfig from '../../lib/resolve-xo-config.js';

const __dirname = path.dirname(url.fileURLToPath(new URL(import.meta.url)));

test('resolveXoConfig: flatOptions is empty array', async t => {
	const cwd = path.resolve(__dirname, '..', 'fixtures', 'no-config', 'no-config-js');

	const {flatOptions} = await resolveXoConfig({
		cwd,
		filePath: path.resolve(cwd, 'no-semi.js'),
	});

	t.deepEqual(flatOptions, []);
});

test('resolveXoConfig: flatOptions is empty array for ts', async t => {
	const cwd = path.resolve(__dirname, '..', 'fixtures', 'no-config', 'no-config-ts');

	const {flatOptions} = await resolveXoConfig({
		cwd,
		filePath: path.resolve(cwd, 'no-semi.ts'),
	});

	t.deepEqual(flatOptions, []);
});
