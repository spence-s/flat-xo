import path from 'node:path';
import url from 'node:url';
import test from 'ava';
import {lintFiles} from '../../lib/index.js';

const __dirname = path.dirname(url.fileURLToPath(new URL(import.meta.url)));

test('lints js file with no config', async (t) => {
  const cwd = path.resolve(
    __dirname,
    '..',
    'fixtures',
    'no-config',
    'no-config-js',
  );

  const {results} = await lintFiles({cwd});

  t.is(results.length, 1);
  t.is(results?.[0]?.messages?.[0]?.messageId, 'missingSemi');
});

test('lints ts file with no config', async (t) => {
  const cwd = path.resolve(
    __dirname,
    '..',
    'fixtures',
    'no-config',
    'no-config-ts',
  );

  const {results} = await lintFiles({cwd});

  t.is(results.length, 1);
  t.is(results?.[0]?.messages?.[0]?.messageId, 'missingSemi');
});

test('lints js and ts files simultaneously with no config', async (t) => {
  const cwd = path.resolve(__dirname, '..', 'fixtures', 'no-config');

  const {results} = await lintFiles({cwd});

  t.is(results.length, 2);
  t.is(results?.[0]?.messages?.[0]?.messageId, 'missingSemi');
  t.is(results?.[1]?.messages?.[0]?.messageId, 'missingSemi');
});
