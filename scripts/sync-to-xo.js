import path from 'node:path';
import fs from 'node:fs/promises';
import {pathExists} from 'path-exists';

const xoRoot = path.resolve(import.meta.dirname, '..', '..', 'xo');
const xoLibFolder = path.resolve(xoRoot, 'lib');
const xoTestFolder = path.resolve(xoRoot, 'test');
const xoCliFile = path.resolve(xoRoot, 'cli.ts');
const xoIndexFile = path.resolve(xoRoot, 'index.ts');
const xoReadmeFile = path.resolve(xoRoot, 'readme.md');

const flatXoRoot = path.resolve(import.meta.dirname, '..');
const flatXoLibFolder = path.resolve(flatXoRoot, 'lib');
const flatXoTestFolder = path.resolve(flatXoRoot, 'test');
const flatXoCliFile = path.resolve(flatXoRoot, 'cli.ts');
const flatXoIndexFile = path.resolve(flatXoRoot, 'index.ts');
const flatXoReadmeFile = path.resolve(flatXoRoot, 'readme.md');

if (await pathExists(xoLibFolder)) {
	await fs.rm(xoLibFolder, {recursive: true, force: true});
}

if (await pathExists(xoTestFolder)) {
	await fs.rm(xoTestFolder, {recursive: true, force: true});
}

if (await pathExists(xoCliFile)) {
	await fs.rm(xoCliFile, {recursive: true, force: true});
}

if (await pathExists(xoIndexFile)) {
	await fs.rm(xoIndexFile, {recursive: true, force: true});
}

if (await pathExists(xoReadmeFile)) {
	await fs.rm(xoReadmeFile, {force: true});
}

await fs.mkdir(xoLibFolder, {recursive: true, force: true});
await fs.cp(flatXoLibFolder, xoLibFolder, {recursive: true, force: true});

await fs.mkdir(xoTestFolder, {recursive: true, force: true});
await fs.cp(flatXoTestFolder, xoTestFolder, {recursive: true, force: true});

await fs.cp(flatXoCliFile, xoCliFile, {force: true});
await fs.cp(flatXoIndexFile, xoIndexFile, {force: true});
await fs.cp(flatXoReadmeFile, xoReadmeFile, {force: true});
