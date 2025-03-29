
import path from 'node:path';
import fs from 'node:fs/promises';
// Import {getTsconfig} from 'get-tsconfig';
// import micromatch from 'micromatch';
import * as parser from '@typescript-eslint/parser';
import type ts from 'typescript';
import {type TsConfigJson} from 'type-fest';
import {tsconfigDefaults, cacheDirName} from './constants.js';
/**
 * This function checks if the files are matched by the tsconfig include, exclude, and it returns the unmatched files.
 * If no tsconfig is found, it will create a fallback tsconfig file in the node_modules/.cache/xo directory.
 *
 * @param options
 * @returns The unmatched files.
 */
export async function handleTsconfig({cwd, files}: {cwd: string; files: string[]}) {
	let program: ts.Program | undefined;

	const tsConfig: TsConfigJson = {};
	const fallbackTsConfigPath = path.join(cwd, 'node_modules', '.cache', cacheDirName, 'tsconfig.xo.json');
	try {
		const start = Date.now();
		program = parser.createProgram('tsconfig.json', cwd);
		console.log(`Program created in ${Date.now() - start}ms`);
	} catch {}

	if (!program) {
		tsConfig.compilerOptions = tsconfigDefaults.compilerOptions;
		tsConfig.files = files;
		try {
			await fs.mkdir(path.dirname(fallbackTsConfigPath), {recursive: true});
			await fs.writeFile(fallbackTsConfigPath, JSON.stringify(tsConfig, null, 2));
		} catch (error) {
			console.error(error);
		}

		return {
			unincludedFiles: files,
			fallbackTsConfigPath,
		};
	}

	const includedFiles = new Set(program.getRootFileNames());

	const unincludedFiles: string[] = [];

	for (const file of files) {
		if (includedFiles.has(file)) {
			continue;
		}

		unincludedFiles.push(file);
	}

	if (unincludedFiles.length > 0) {
		// @ts-expect-error trash types
		tsConfig.compilerOptions = program.getCompilerOptions() ?? tsconfigDefaults.compilerOptions;
		tsConfig.files = unincludedFiles;
		try {
			await fs.mkdir(path.dirname(fallbackTsConfigPath), {recursive: true});
			await fs.writeFile(fallbackTsConfigPath, JSON.stringify(tsConfig, null, 2));
		} catch (error) {
			console.error(error);
		}
	}

	return {unincludedFiles, fallbackTsConfigPath};
}
