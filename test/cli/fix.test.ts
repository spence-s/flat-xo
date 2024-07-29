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

test.skip('cli xo --cwd', async (t) => {
  const filePath = path.join(t.context.cwd, 'test.js');
  await fs.writeFile(filePath, dedent`console.log('hello')\n`, 'utf8');

  try {
    await $`node . --cwd ${t.context.cwd}`;
  } catch (error) {
    // @ts-expect-error TODO: type this better
    t.log(error?.stderr);
    // @ts-expect-error TODO: type this better
    t.snapshot(error?.stdout);
  }
});

test.skip('cli xo --cwd --printConfig', async (t) => {
  const filePath = path.join(t.context.cwd, 'test.js');
  await fs.writeFile(filePath, dedent`console.log('hello')\n`, 'utf8');

  try {
    await $`node . --cwd ${t.context.cwd} --printConfig`;
  } catch (error) {
    // @ts-expect-error TODO: type this better
    t.log(error?.stderr);
    // @ts-expect-error TODO: type this better
    t.snapshot(error?.stdout);
  }
});
