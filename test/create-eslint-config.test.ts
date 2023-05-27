import test from 'ava';
import createConfig from '../lib/create-eslint-config.js';

test('base config', async t => {
	const config = await createConfig();

	t.log(config);

	t.pass();
});
