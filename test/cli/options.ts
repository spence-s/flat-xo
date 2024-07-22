// import fs from 'node:fs/promises';
// import path from 'node:path';
// import _test, {type TestFn} from 'ava'; // eslint-disable-line ava/use-test
// import dedent from 'dedent';
// import {$} from 'execa';
// import {XO} from '../../lib/xo.js';
// import {copyTestProject} from '../helpers/copy-test-project.js';

// const test = _test as TestFn<{cwd: string}>;

// test.beforeEach(async (t) => {
//   t.context.cwd = await copyTestProject();
// });

// test.afterEach.always(async (t) => {
//   await fs.rm(t.context.cwd, {recursive: true, force: true});
// });
// flags: {
//   fix: {
//     type: 'boolean',
//   },
//   tsconfig: {
//     aliases: ['tsConfig'],
//     type: 'string',
//   },
//   reporter: {
//     type: 'string',
//   },
//   space: {
//     type: 'string',
//   },
//   semicolon: {
//     type: 'boolean',
//   },
//   prettier: {
//     type: 'boolean',
//   },
//   ezTs: {
//     type: 'boolean',
//   },
//   cwd: {
//     type: 'string',
//     default: process.cwd(),
//   },
//   printConfig: {
//     type: 'string',
//   },
//   version: {
//     type: 'boolean',
//   },
//   ignore: {
//     type: 'string',
//     isMultiple: true,
//   },
// }

// test('--fix', async (t) => {
//   const filePath = path.join(t.context.cwd, 'test.js');
//   await fs.writeFile(filePath, dedent`console.log('hello')\n`, 'utf8');
//   await $({cwd: t.context.cwd})`xo --fix`;
// });
