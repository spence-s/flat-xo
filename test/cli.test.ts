import fs from 'node:fs/promises';
import path from 'node:path';
import _test, {type TestFn} from 'ava'; // eslint-disable-line ava/use-test
import dedent from 'dedent';
import {$} from 'execa';
import {copyTestProject} from './helpers/copy-test-project.js';

const test = _test as TestFn<{cwd: string}>;

test.beforeEach(async t => {
  t.context.cwd = await copyTestProject();
});

test.afterEach.always(async t => {
  await fs.rm(t.context.cwd, {recursive: true, force: true});
});

test('xo --cwd', async t => {
  const filePath = path.join(t.context.cwd, 'test.js');
  await fs.writeFile(filePath, dedent`console.log('hello');\n`, 'utf8');

  await t.notThrowsAsync($`node ./dist/lib/cli --cwd ${t.context.cwd}`);
});

test('xo --fix', async t => {
  const filePath = path.join(t.context.cwd, 'test.js');
  await fs.writeFile(filePath, dedent`console.log('hello')\n`, 'utf8');
  await t.notThrowsAsync($`node ./dist/lib/cli --cwd ${t.context.cwd} --fix`);
  const fileContent = await fs.readFile(filePath, 'utf8');
  t.is(fileContent, dedent`console.log('hello');\n`);
});
