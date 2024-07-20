import fs from 'node:fs/promises';
import process from 'node:process';
import path from 'node:path';
import tempDir from 'temp-dir';
import {$} from 'execa';
import {pathExists} from 'path-exists';

/**
 * Creates a test project with a package.json and tsconfig.json
 * and installs the dependencies.
 *
 * @returns {string} The path to the test project.
 */
const cwd = path.join(tempDir, 'test-project');

if (await pathExists(cwd)) {
  await fs.rm(cwd, {recursive: true, force: true});
}

// create the test project directory
await fs.mkdir(cwd, {recursive: true});

// create a package.json file
await fs.writeFile(
  path.join(cwd, 'package.json'),
  JSON.stringify({
    type: 'module',
    name: 'test-project',
  }),
);

// create a tsconfig.json file
await fs.writeFile(
  path.join(cwd, 'tsconfig.json'),
  JSON.stringify({
    compilerOptions: {
      module: 'node16',
      target: 'ES2022',
      strictNullChecks: true,
      lib: ['DOM', 'DOM.Iterable', 'ES2022'],
    },
    files: [path.join(cwd, 'test.ts')],
    exclude: ['node_modules'],
  }),
);

// npm install in the test project directory
// which we will repeatedly copy in the temp dir to test the project against
await $({cwd, stdio: 'inherit'})`npm install --save-dev typescript @types/node`;

// run the build in and test the project in the local dir
await $({stdio: 'inherit'})`npm run build`;
try {
  await $({stdio: 'inherit'})`ava -m resolve*`;
} catch {
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
}
