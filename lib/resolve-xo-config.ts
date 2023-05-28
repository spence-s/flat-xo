import path from 'node:path';
import process from 'node:process';
import {cosmiconfig /* defaultLoaders */} from 'cosmiconfig';
import pick from 'lodash.pick';
import {type FlatESLintConfig} from 'eslint-define-config';
import {
	type LintOptions,
	type FlatXoConfig,
} from './types.js';
import {MODULE_NAME} from './constants.js';

// Async cosmiconfig loader for es module types
const loadModule = async (fp: string) => {
	const {default: module} = (await import(fp)) as {default: FlatESLintConfig};
	return module;
};

/**
 * Finds the xo config file
 */
async function resolveXoConfig(options: LintOptions): Promise<{
	flatOptions: FlatXoConfig;
}> {
	if (!options.cwd) {
		options.cwd = process.cwd();
	}

	if (!path.isAbsolute(options.cwd)) {
		options.cwd = path.resolve(process.cwd(), options.cwd);
	}

	const stopDir = path.dirname(options.cwd);

	// const pkgConfigExplorer = cosmiconfig('engines', {
	//   searchPlaces: ['package.json'],
	//   stopDir: options.cwd,
	// });

	const flatConfigExplorer = cosmiconfig(MODULE_NAME, {
		searchPlaces: [
			`${MODULE_NAME}.config.js`,
			`${MODULE_NAME}.config.cjs`,
			`${MODULE_NAME}.config.mjs`,
		],
		stopDir,
		loaders: {
			'.js': loadModule,
			'.mjs': loadModule,
		},
	});

	if (options.filePath) {
		options.filePath = path.resolve(options.cwd, options.filePath);
	}

	const searchPath = options.filePath ?? options.cwd;

	let [
		{config: flatOptions = [] /* filepath: flatConfigPath = '' */},
		// {config: enginesOptions = {}},
	] = await Promise.all([
		(async () =>
			(await flatConfigExplorer.search(searchPath)) ?? {})() as Promise<{
			config: FlatXoConfig | undefined;
			filepath: string;
		}>,
		// (async () =>
		//   (await pkgConfigExplorer.search(searchPath)) ?? {})() as Promise<{
		//   config: {engines: string} | undefined;
		// }>,
	]);

	const globalKeys = [
		'ignores',
		'settings',
		'parserOptions',
		'prettier',
		'semicolon',
		'space',
		'rules',
		'env',
		'extension',
	];

	const flatOnlyKeys = ['plugins'];

	flatOptions = flatOptions.map(conf =>
		pick(conf, [...globalKeys, ...flatOnlyKeys]),
	);

	return {
		// enginesOptions,
		flatOptions,
	};
}

export default resolveXoConfig;
