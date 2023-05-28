/* eslint-disable complexity */
// import path from 'node:path';
import pluginAva from 'eslint-plugin-ava';
import pluginUnicorn from 'eslint-plugin-unicorn';
import pluginImport from 'eslint-plugin-import';
import pluginN from 'eslint-plugin-n';
import pluginComments from 'eslint-plugin-eslint-comments';
import pluginNoUseExtendNative from 'eslint-plugin-no-use-extend-native';
import configXoTypescript from 'eslint-config-xo-typescript';
import configXo from 'eslint-config-xo';
import pluginTypescript from '@typescript-eslint/eslint-plugin';
import * as tsParser from '@typescript-eslint/parser';
import pluginPrettier from 'eslint-plugin-prettier';
import configPrettier from 'eslint-config-prettier';
import arrify from 'arrify';
import globals from 'globals';
// eslint-disable-next-line import/no-named-default
import {default as prettier} from 'prettier';
import isEmpty from 'lodash.isempty';
import pick from 'lodash.pick';
import {
	type FlatESLintConfigItem,
	type FlatESLintConfig,
} from 'eslint-define-config';
import {
	ALL_EXTENSIONS,
	DEFAULT_IGNORES,
	TS_EXTENSIONS,
	JS_FILES_GLOB,
	TS_FILES_GLOB,
	JS_EXTENSIONS,
} from './constants.js';
import {type XoConfigItem} from './types.js';
import {jsRules, tsRules, baseRules} from './rules.js';

let cachedPrettierConfig: Record<string, unknown>;

/**
 * Takes a xo flat config and returns an eslint flat config
 */
async function createConfig(
	userConfigs?: XoConfigItem[],
	tsconfigPath?: string,
): Promise<FlatESLintConfig[]> {
	// The default global options
	let _prettier;
	const cwd = '';

	const baseConfig: FlatESLintConfig[] = [
		{
			ignores: DEFAULT_IGNORES,
		},
		{
			files: [JS_FILES_GLOB, TS_FILES_GLOB],
			plugins: {
				'no-use-extend-native': pluginNoUseExtendNative,
				ava: pluginAva,
				unicorn: pluginUnicorn,
				import: pluginImport,
				n: pluginN,
				'eslint-comments': pluginComments,
			},
			languageOptions: {
				globals: {
					...(globals.es2021 as Record<string, boolean>),
					...(globals.node as Record<string, boolean>),
				},
				ecmaVersion: configXo.parserOptions?.ecmaVersion,
				sourceType: configXo.parserOptions?.sourceType,
				parserOptions: {
					...configXo.parserOptions,
				},
			},
			settings: {
				'import/core-modules': ['electron', 'atom'],
				'import/parsers': {
					espree: ALL_EXTENSIONS,
				},
				'import/resolver': {
					node: true,
				},
			},
			rules: {...baseRules, ...jsRules},
		},
		{
			files: [TS_FILES_GLOB],
			rules: tsRules,
		},
		...(configXoTypescript.overrides?.map<FlatESLintConfigItem>(override => ({
			files: arrify(override.files),
			ignores: arrify(override.excludedFiles),
			rules: override.rules,
		})) ?? []),
	].filter(Boolean);

	/**
   * Since configs are merged and the last config takes precedence
   * this means we need to handle both true AND false cases for each option.
   * ie... we need to turn prettier,space,semi,etc... on or off for a specific file
   */
	for (const userConfig of userConfigs ?? []) {
		console.log('userConfig,', userConfig);

		if (Object.keys(userConfig).length === 0) {
			continue;
		}

		/**
     * Special case
     * string of built in recommended configs
     */
		if (typeof userConfig === 'string') {
			baseConfig.push(userConfig);
			continue;
		}

		/**
     * Special case
     * global ignores
     */
		if (
			Object.keys(userConfig).length === 1
      && Object.keys(userConfig)[0] === 'ignores'
		) {
			// Accept ignores as a string or array of strings for user convenience
			userConfig.ignores = arrify(userConfig.ignores);
			baseConfig.push(userConfig);
			continue;
		}

		if (userConfig.files === undefined) {
			userConfig.files = [JS_FILES_GLOB];
		}

		const tsUserConfig: Required<Pick<XoConfigItem, 'rules'>> & XoConfigItem = {
			files: [TS_FILES_GLOB],
			rules: {},
		};

		if (!userConfig.rules) {
			// Set up a default rules object to potentially add to if needed
			userConfig.rules = {};
		}

		if (userConfig.semicolon === false) {
			tsUserConfig.rules['@typescript-eslint/semi'] = ['error', 'never'];
			userConfig.rules.semi = ['error', 'never'];
			userConfig.rules['semi-spacing'] = [
				'error',
				{
					before: false,
					after: true,
				},
			];
		}

		if (userConfig.space) {
			const spaces = typeof userConfig.space === 'number' ? userConfig.space : 2;

			userConfig.rules = {
				...userConfig.rules,
				indent: ['error', spaces, {SwitchCase: 1}],
			};
			tsUserConfig.rules = {
				...tsUserConfig.rules,
				'@typescript-eslint/indent': ['error', spaces, {SwitchCase: 1}],
			};
		} else if (userConfig.space === false) {
			// If a user set this false for a small subset of files for some reason,
			// then we need to set them back to their original values
			userConfig.rules = {
				...userConfig.rules,
				indent: configXo?.rules?.['indent'],
			};

			tsUserConfig.rules = {
				...tsUserConfig.rules,
				'@typescript-eslint/indent':
          configXoTypescript?.rules?.['@typescript-eslint/indent'],
			};
		}

		if (_prettier) {
			const prettierOptions
        = cachedPrettierConfig
        // eslint-disable-next-line no-await-in-loop
        ?? (await prettier.resolveConfig(cwd, {editorconfig: true}))
        ?? {};

			// Only look up prettier once per run
			cachedPrettierConfig = prettierOptions;

			if (
				(userConfig.semicolon && prettierOptions['semi'] === false)
        ?? (!userConfig.semicolon && prettierOptions['semi'] === true)
			) {
				throw new Error(
					// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
					`The Prettier config \`semi\` is ${prettierOptions['semi']} while XO \`semicolon\` is ${userConfig.semicolon}`,
				);
			}

			if (
				((userConfig.space ?? typeof userConfig.space === 'number')
          && prettierOptions['useTabs'] === true)
        || (!userConfig.space && prettierOptions['useTabs'] === false)
			) {
				throw new Error(
					// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
					`The Prettier config \`useTabs\` is ${prettierOptions['useTabs']} while XO \`space\` is ${userConfig.space}`,
				);
			}

			if (
				typeof userConfig.space === 'number'
        && typeof prettierOptions['tabWidth'] === 'number'
        && userConfig.space !== prettierOptions['tabWidth']
			) {
				throw new Error(
					`The Prettier config \`tabWidth\` is ${prettierOptions['tabWidth']} while XO \`space\` is ${userConfig.space}`,
				);
			}

			userConfig.plugins = {
				...userConfig.plugins,
				prettier: pluginPrettier,
			};

			userConfig.rules = {
				...userConfig.rules,
				...pluginPrettier.configs?.['recommended']?.rules,
				'prettier/prettier': [
					'error',
					{
						singleQuote: true,
						bracketSpacing: false,
						bracketSameLine: false,
						trailingComma: 'all',
						tabWidth: typeof userConfig.space === 'number' ? userConfig.space : 2,
						useTabs: !userConfig.space,
						semi: userConfig.semicolon,
						...prettierOptions,
					},
				],
				...configPrettier.rules,
			};
		} else if (_prettier === false) {
			// Turn prettier off for a subset of files
			userConfig.rules = {
				...userConfig.rules,
				'prettier/prettier': 'off',
			};
		}

		const options = [
			'files',
			'ignores',
			'languageOptions',
			'plugins',
			'settings',
			'rules',
		];

		baseConfig.push(pick(userConfig, options));
		if (!isEmpty(tsUserConfig.rules)) {
			baseConfig.push(pick(tsUserConfig, options));
		}
	}

	// Esnure all ts files are parsed with the ts parser so this is added last
	// this makes it easy to add '@typescript-eslint/*' rules anywhere with no worries
	// helps everything to load these last
	baseConfig.push({
		files: [TS_FILES_GLOB],
		plugins: {
			// @ts-expect-error just not typed correctly yet
			'@typescript-eslint': pluginTypescript,
		},
		languageOptions: {
			// @ts-expect-error just not typed correctly yet
			parser: tsParser,
			parserOptions: {
				...configXoTypescript.parserOptions,
				ecmaFeatures: {modules: true},
				project: tsconfigPath ?? './tsconfig.json', // Tsconfig,
			},
		},
		settings: {
			'import/extensions': JS_EXTENSIONS,
			'import/external-module-folders': ['node_modules', 'node_modules/@types'],
			'import/parsers': {
				'@typescript-eslint/parser': TS_EXTENSIONS,
			},
			'import/resolver': {
				typescript: true,
				node: true,
			},
			'@typescript-eslint/parser': tsParser,
		},
		rules: {
			'import/named': 'off',
		},
	});

	return baseConfig;
}

export default createConfig;
