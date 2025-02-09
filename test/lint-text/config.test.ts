import fs from 'node:fs/promises';
import path from 'node:path';
import _test, {type TestFn} from 'ava'; // eslint-disable-line ava/use-test
import dedent from 'dedent';
import {type TsConfigJson} from 'get-tsconfig';
import {XO} from '../../lib/xo.js';
import {copyTestProject} from '../helpers/copy-test-project.js';

const test = _test as TestFn<{cwd: string}>;

test.beforeEach(async t => {
  t.context.cwd = await copyTestProject();
});

test.afterEach.always(async t => {
  await fs.rm(t.context.cwd, {recursive: true, force: true});
});

test('no config > js > semi', async t => {
  const filePath = path.join(t.context.cwd, 'test.js');
  const {results} = await new XO({cwd: t.context.cwd}).lintText(
    dedent`console.log('hello')\n`,
    {filePath},
  );
  t.is(results.length, 1);
  t.is(results?.[0]?.messages?.[0]?.ruleId, '@stylistic/semi');
});

test('no config > ts > semi', async t => {
  const filePath = path.join(t.context.cwd, 'test.ts');
  const {results} = await new XO({cwd: t.context.cwd}).lintText(
    dedent`console.log('hello')\n`,
    {filePath},
  );

  t.is(results?.[0]?.messages?.length, 1);
  t.is(results?.[0]?.messages?.[0]?.ruleId, '@stylistic/semi');
});

test('flat config > semi > js', async t => {
  const filePath = path.join(t.context.cwd, 'test.js');
  await fs.writeFile(
    path.join(t.context.cwd, 'xo.config.js'),
    dedent`
      export default [
        {
          semicolon: false
        }
      ]\n
    `,
    'utf8',
  );
  const xo = new XO({cwd: t.context.cwd});
  const {results} = await xo.lintText(dedent`console.log('hello');\n`, {
    filePath,
  });
  t.is(results?.[0]?.messages?.length, 1);
  t.is(results?.[0]?.messages?.[0]?.ruleId, '@stylistic/semi');
});

test('typescript file with flat config - semicolon', async t => {
  const filePath = path.join(t.context.cwd, 'test.ts');
  await fs.writeFile(
    path.join(t.context.cwd, 'xo.config.js'),
    dedent`
      export default [
        {
          semicolon: false
        }
      ];\n
    `,
    'utf8',
  );
  const xo = new XO({cwd: t.context.cwd});
  const {results} = await xo.lintText(dedent`console.log('hello');\n`, {
    filePath,
  });
  t.is(results?.[0]?.messages?.length, 1);
  t.is(results?.[0]?.messages?.[0]?.ruleId, '@stylistic/semi');
});

test('typescript file with no tsconfig - semicolon', async t => {
  const filePath = path.join(t.context.cwd, 'test.ts');
  t.log('filePath', filePath);
  await fs.rm(path.join(t.context.cwd, 'tsconfig.json'), {force: true});

  await fs.writeFile(
    path.join(t.context.cwd, 'xo.config.js'),
    dedent`
      export default [
        {
          semicolon: false
        }
      ];\n
    `,
    'utf8',
  );

  const xo = new XO({cwd: t.context.cwd, ts: true});
  const {results} = await xo.lintText(dedent`console.log('hello');\n`, {
    filePath,
  });

  t.log(results[0]);

  const generatedTsconfig = JSON.parse(await fs.readFile(path.join(t.context.cwd, 'node_modules', '.cache', 'xo-linter', 'tsconfig.xo.json'), 'utf8')) as TsConfigJson;

  t.log(generatedTsconfig);

  t.true(generatedTsconfig.files?.includes(filePath));

  t.is(results?.[0]?.messages?.length, 1);

  t.is(results?.[0]?.messages?.[0]?.ruleId, '@stylistic/semi');
});

test('flat config > space > js', async t => {
  const filePath = path.join(t.context.cwd, 'test.js');

  await fs.writeFile(
    path.join(t.context.cwd, 'xo.config.js'),
    dedent`
      export default [
        {
          space: true
        }
      ];\n
    `,
    'utf8',
  );

  const xo = new XO({cwd: t.context.cwd});
  const {results} = await xo.lintText(
    dedent`
      export function foo() {
      	console.log('hello');
      }\n
    `,
    {
      filePath,
    },
  );
  t.is(results?.[0]?.messages.length, 1);
  t.is(results?.[0]?.messages?.[0]?.messageId, 'wrongIndentation');
  t.is(results?.[0]?.messages?.[0]?.ruleId, '@stylistic/indent');
});

test('flat config > space > ts', async t => {
  const filePath = path.join(t.context.cwd, 'test.ts');

  await fs.writeFile(
    path.join(t.context.cwd, 'xo.config.js'),
    dedent`
      export default [
        {
          space: true
        }
      ];\n
    `,
    'utf8',
  );

  const xo = new XO({cwd: t.context.cwd});
  const {results} = await xo.lintText(
    dedent`
      export function foo() {
      	console.log('hello');
      }\n
    `,
    {
      filePath,
    },
  );
  t.is(results?.[0]?.messages.length, 1);
  t.is(results?.[0]?.messages?.[0]?.messageId, 'wrongIndentation');
  t.is(results?.[0]?.messages?.[0]?.ruleId, '@stylistic/indent');
});
