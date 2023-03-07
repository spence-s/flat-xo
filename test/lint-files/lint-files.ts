import path from 'node:path';
import url from 'node:url';
import test from 'ava';
import {lintFiles} from '../../lib/index.js';

const __dirname = path.dirname(url.fileURLToPath(new URL(import.meta.url)));

test('lints js file', async (t) => {
  const cwd = path.resolve(__dirname, '..', 'fixtures', 'no-config-js');

  const results = await lintFiles('', {cwd});

  t.is(results.errorCount, 1);
  t.is(results?.messages?.[0]?.messageId, 'missingSemi');
});

test('lints ts file', async (t) => {
  const cwd = path.resolve(__dirname, '..', 'fixtures', 'no-config-ts');

  const results = await lintFiles('', {cwd});

  t.is(results.errorCount, 1);
  t.is(results?.messages?.[0]?.messageId, 'missingSemi');
});
