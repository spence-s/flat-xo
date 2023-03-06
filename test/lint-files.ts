import path from 'node:path';
import url from 'node:url';
import test from 'ava';
import {lintFiles} from '../lib/index.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

test('lints js file', async (t) => {
  const cwd = path.join(__dirname, 'fixtures', 'no-config-js');

  t.log(await lintFiles('', {cwd}));
  t.pass();
});
