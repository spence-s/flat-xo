import path from 'node:path';
import fs from 'node:fs/promises';
import test from 'ava';
import dedent from 'dedent';
import {XO} from '../../lib/index.js';
import {setupTestProject} from '../helpers/setup-test-project.js';

let cwd: string;
let filePath: string;
let tsFilePath: string;

test.before(async () => {
  cwd = await setupTestProject();
  filePath = path.join(cwd, 'test.js');
  tsFilePath = path.join(cwd, 'test.ts');
});

test.after.always(async () => {
  await fs.rm(cwd, {recursive: true, force: true});
});

test('no-use-extend-native', async (t) => {
  const {results} = await new XO({cwd}).lintText(
    dedent`
      import {util} from 'node:util';

      util.isBoolean('50bda47b09923e045759db8e8dd01a0bacd97370'.shortHash() === '50bdcs47');\n
    `,
    {filePath},
  );
  t.true(results[0]?.messages?.length === 1);
  t.truthy(results[0]?.messages?.[0]);
  t.is(
    results[0]?.messages?.[0]?.ruleId,
    'no-use-extend-native/no-use-extend-native',
  );
});

test('no-use-extend-native ts', async (t) => {
  const {results} = await new XO({cwd}).lintText(
    dedent`
      import {util} from 'node:util';

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      util.isBoolean('50bda47b09923e045759db8e8dd01a0bacd97370'.shortHash() === '50bdcs47');\n
    `,
    {filePath: tsFilePath},
  );
  t.true(results[0]?.messages?.length === 1);
  t.truthy(results[0]?.messages?.[0]);
  t.is(
    results[0]?.messages?.[0]?.ruleId,
    'no-use-extend-native/no-use-extend-native',
  );
});

test('eslint-plugin-import import/order', async (t) => {
  const {results} = await new XO({cwd}).lintText(
    dedent`
      import foo from 'foo';
      import {util} from 'node:util';

      util.inspect(foo);\n
    `,
    {filePath},
  );

  t.true(results[0]?.messages?.length === 1);
  t.truthy(results[0]?.messages?.[0]);
  t.is(results[0]?.messages?.[0]?.ruleId, 'import/order');
});

test('eslint-plugin-import import/order ts', async (t) => {
  const {results} = await new XO({cwd}).lintText(
    dedent`
      import foo from 'foo';
      import util from 'node:util';

      util.inspect(foo);\n
    `,
    {filePath: tsFilePath},
  );
  t.true(results[0]?.messages?.length === 1);
  t.truthy(results[0]?.messages?.[0]);
  t.is(results[0]?.messages?.[0]?.ruleId, 'import/order');
});

test('eslint-plugin-import import/extensions', async (t) => {
  const {results} = await new XO({cwd}).lintText(
    dedent`
    import foo from './foo';

    console.log(foo);\n
    `,
    {filePath},
  );
  t.true(results[0]?.messages?.length === 1);
  t.truthy(results[0]?.messages?.[0]);
  t.is(results[0]?.messages?.[0]?.ruleId, 'import/extensions');
});

test('eslint-plugin-import import/extensions ts', async (t) => {
  const {results} = await new XO({cwd}).lintText(
    dedent`
      import foo from './foo';

      console.log(foo);\n
    `,
    {filePath: tsFilePath},
  );
  t.true(results[0]?.messages?.length === 1);
  t.truthy(results[0]?.messages?.[0]);
  t.is(results[0]?.messages?.[0]?.ruleId, 'import/extensions');
});

test('eslint-plugin-n n/prefer-global/process', async (t) => {
  const {results} = await new XO({cwd}).lintText(
    dedent`
      process.cwd();\n
    `,
    {filePath},
  );
  t.true(results[0]?.messages?.length === 1);
  t.truthy(results[0]?.messages?.[0]);
  t.is(results[0]?.messages?.[0]?.ruleId, 'n/prefer-global/process');
});

test('eslint-plugin-n n/prefer-global/process ts', async (t) => {
  const {results} = await new XO({
    cwd,
    tsconfig: path.join(cwd, 'tsconfig.json'),
  }).lintText(
    dedent`
      process.cwd();\n
    `,
    {filePath: tsFilePath},
  );
  t.true(results[0]?.messages?.length === 1);
  t.truthy(results[0]?.messages?.[0]);
  t.is(results[0]?.messages?.[0]?.ruleId, 'n/prefer-global/process');
});
