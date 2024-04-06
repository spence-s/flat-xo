import path from 'node:path';
// import url from 'node:url';
import fs from 'node:fs/promises';
import process from 'node:process';
import test from 'ava';
import dedent from 'dedent';
import cwd from 'temp-dir';
import {XO} from '../../lib/index.js';

const filePath = path.join(cwd, 'test.js');
const tsFilePath = path.join(cwd, 'test.ts');

test.before(async () => {
  await fs.writeFile(
    path.join(cwd, 'tsconfig.json'),
    JSON.stringify({
      files: [`${tsFilePath}`],
    }),
  );
});

test('no-use-extend-native', async (t) => {
  const {results} = await new XO({cwd}).lintText(
    dedent`
      import {util} from 'node:util';

      util.isBoolean('50bda47b09923e045759db8e8dd01a0bacd97370'.shortHash() === '50bdcs47');\n
    `,
    {filePath},
  );

  const noUseExtendNativeResult = results[0]?.messages?.find(
    ({ruleId}) => ruleId === 'no-use-extend-native/no-use-extend-native',
  );
  t.true(results[0]?.messages?.length === 1);
  t.truthy(noUseExtendNativeResult);
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

  const orderResult = results[0]?.messages?.find(
    ({ruleId}) => ruleId === 'import/order',
  );
  t.true(results[0]?.messages?.length === 1);
  t.truthy(orderResult);
});

test('eslint-plugin-n n/prefer-global-process', async (t) => {
  const {results} = await new XO({cwd}).lintText(
    dedent`
      process.cwd();\n
    `,
    {filePath},
  );

  const nResult = results[0]?.messages?.find(
    ({ruleId}) => ruleId === 'n/prefer-global/process',
  );
  t.true(results[0]?.messages?.length === 1);
  t.truthy(nResult);
});

test('eslint-plugin-n n/prefer-global-process ts', async (t) => {
  const {results} = await new XO({
    cwd,
    tsconfig: path.join(cwd, 'tsconfig.json'),
  }).lintText(
    dedent`
      process.cwd();\n
    `,
    {tsconfig: path.join(process.cwd(), 'tsconfig.json'), filePath: tsFilePath},
  );

  const nResult = results[0]?.messages?.find(
    ({ruleId}) => ruleId === 'n/prefer-global/process',
  );
  t.log(results[0]?.messages);
  t.true(results[0]?.messages?.length === 1);
  t.truthy(nResult);
});
