import fs from 'node:fs/promises';
import path from 'node:path';
import _test, {type TestFn} from 'ava'; // eslint-disable-line ava/use-test
import dedent from 'dedent';
import {$} from 'execa';
import {copyTestProject} from '../helpers/copy-test-project.js';

const test = _test as TestFn<{cwd: string}>;

test.beforeEach(async (t) => {
  t.context.cwd = await copyTestProject();
});

test.afterEach.always(async (t) => {
  await fs.rm(t.context.cwd, {recursive: true, force: true});
});

test.skip('options --fix', async (t) => {
  const filePath = path.join(t.context.cwd, 'test.js');
  await fs.writeFile(filePath, dedent`console.log('hello')\n`, 'utf8');

  try {
    await $({stdio: 'inherit'})`node . --fix --cwd ${t.context.cwd}`;
  } catch {}

  const newFile = await fs.readFile(filePath, 'utf8');

  t.log(newFile);
  t.is(newFile, dedent`console.log('hello');\n`);
});
