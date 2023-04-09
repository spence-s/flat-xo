import path from 'node:path';
import url from 'node:url';
import test from 'ava';
import createConfig from '../../lib/create-eslint-config.js';

const __dirname = path.dirname(url.fileURLToPath(new URL(import.meta.url)));

test('returns an array', async t => {
	const config = await createConfig();

	t.true(Array.isArray(config));
});
