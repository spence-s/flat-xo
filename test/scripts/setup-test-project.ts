import fs from 'node:fs/promises';
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
export const setupTestProject = async () => {
  const cwd = tempDir + '/test-project';

  if (await pathExists(cwd)) {
    await fs.rm(cwd, {recursive: true, force: true});
  }

  await fs.mkdir(cwd, {recursive: true});
  await fs.writeFile(
    path.join(cwd, 'package.json'),
    JSON.stringify({
      name: 'test-project',
    }),
  );
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

  await $({cwd})`npm install --save-dev typescript @types/node`;

  // await $`open ${cwd}`;

  return cwd;
};
