import fs from 'node:fs/promises';
import path from 'node:path';
import _test, {type TestFn} from 'ava'; // eslint-disable-line ava/use-test
import dedent from 'dedent';
import {XO} from '../../lib/index.js';
import {copyTestProject} from '../helpers/setup-test-project.js';

const test = _test as TestFn<{cwd: string}>;

test.before(async (t) => {
  t.context.cwd = await copyTestProject();
});

test.after.always(async (t) => {
  await fs.rm(t.context.cwd, {recursive: true, force: true});
});

test('no config > js > semi', async (t) => {
  const filePath = path.join(t.context.cwd, 'test.js');
  const {results} = await new XO({cwd: t.context.cwd}).lintText(
    dedent`console.log('hello')\n`,
    {filePath},
  );
  t.is(results.length, 1);
  t.is(results?.[0]?.messages?.[0]?.ruleId, 'semi');
});

test('no config > ts > semi', async (t) => {
  const filePath = path.join(t.context.cwd, 'test.ts');
  const {results} = await new XO({cwd: t.context.cwd}).lintText(
    dedent`console.log('hello')\n`,
    {filePath},
  );

  t.log(results?.[0]?.messages);
  t.is(results?.[0]?.messages?.[0]?.ruleId, '@typescript-eslint/semi');
});

// test('flat config > semi > js', async (t) => {
//   const filePath = path.join(t.context.cwd, 'semi.js');
//   const xo = new XO({cwd: t.context.cwd});
//   const {results} = await xo.lintText(await readFile(filePath), {
//     filePath,
//   });
//   t.is(results.length, 1);
//   t.is(results?.[0]?.messages?.[0]?.messageId, 'extraSemi');
//   t.is(results?.[0]?.messages?.[0]?.ruleId, 'semi');
// });

// test('flat config > semi > ts', async (t) => {
//   const filePath = path.join(t.context.cwd, 'semi.ts');
//   const xo = new XO({cwd: t.context.cwd});
//   const {results} = await xo.lintText(await readFile(filePath), {
//     filePath,
//   });
//   t.is(results.length, 1);
//   t.is(results?.[0]?.messages?.[0]?.messageId, 'extraSemi');
//   t.is(results?.[0]?.messages?.[0]?.ruleId, '@typescript-eslint/semi');
// });

// test('flat config > space > js', async (t) => {
//   const filePath = path.join(t.context.cwd, 'space.js');
//   const xo = new XO({cwd: t.context.cwd});
//   const {results} = await xo.lintText(await readFile(filePath), {
//     filePath,
//   });
//   t.is(results.length, 1);
//   t.is(results?.[0]?.messages?.[0]?.messageId, 'wrongIndentation');
//   t.is(results?.[0]?.messages?.[0]?.ruleId, 'indent');
// });

// test('flat config > space > ts', async (t) => {
//   const filePath = path.join(t.context.cwd, 'space.ts');
//   const xo = new XO({cwd: t.context.cwd});
//   const {results} = await xo.lintText(await readFile(filePath), {
//     filePath,
//   });
//   t.is(results.length, 1);
//   t.is(results?.[0]?.messages?.[0]?.messageId, 'wrongIndentation');
//   t.is(results?.[0]?.messages?.[0]?.ruleId, '@typescript-eslint/indent');
// });

// test('flat config > space > js', async (t) => {
//   const filePath = path.join(cwd, 'space.js');
//   const xo = new XO({cwd});
//   const {results} = await xo.lintText(await readFile(filePath), {
//     filePath,
//   });
//   t.is(results.length, 1);
//   t.is(results?.[0]?.messages?.[0]?.messageId, 'wrongIndentation');
//   t.is(results?.[0]?.messages?.[0]?.ruleId, 'indent');
// });

// test('flat config > space > ts', async (t) => {
//   const filePath = path.join(cwd, 'space.ts');
//   const xo = new XO({cwd});
//   const {results} = await xo.lintText(await readFile(filePath), {
//     filePath,
//   });
//   t.is(results.length, 1);
//   t.is(results?.[0]?.messages?.[0]?.messageId, 'wrongIndentation');
//   t.is(results?.[0]?.messages?.[0]?.ruleId, '@typescript-eslint/indent');
// });
