import path from 'node:path';
import fs from 'node:fs/promises';
import {pathExists} from 'path-exists';

const xoRoot = path.resolve(import.meta.dirname, '..', '..', 'xo');
const flatXoRoot = path.resolve(import.meta.dirname, '..');

const xoLibFolder = path.resolve(xoRoot, 'lib');
const flatXoLibFolder = path.resolve(flatXoRoot, 'lib');

const xoTestFolder = path.resolve(xoRoot, 'test');
const flatXoTestFolder = path.resolve(flatXoRoot, 'test');

if (await pathExists(flatXoLibFolder)) {
	await fs.rm(flatXoLibFolder, {recursive: true, force: true});
}

if (await pathExists(flatXoTestFolder)) {
	await fs.rm(flatXoTestFolder, {recursive: true, force: true});
}

await fs.mkdir(flatXoLibFolder, {recursive: true, force: true});
await fs.cp(xoLibFolder, flatXoLibFolder, {recursive: true, force: true});

await fs.mkdir(flatXoTestFolder, {recursive: true, force: true});
await fs.cp(xoTestFolder, flatXoTestFolder, {recursive: true, force: true});
