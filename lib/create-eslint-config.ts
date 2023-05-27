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
	DEFAULT_IGNORES,
	DEFAULT_EXTENSION,
	TYPESCRIPT_EXTENSION,
} from './constants.js';
import {type XoConfigItem} from './types.js';
import {rules, tsRules} from './rules.js';

const JS_FILES_GLOB = `**/*.{${DEFAULT_EXTENSION.join(',')}}`;

const TS_FILES_GLOB = `**/*.{${TYPESCRIPT_EXTENSION.join(',')}}`;

let cachedPrettierConfig: Record<string, unknown>;

/**
 * Takes a xo flat config and returns an eslint flat config
 */
async function createConfig(
	userConfigs?: XoConfigItem[],
): Promise<FlatESLintConfig[]> {
	// the default global options
	let _prettier;
	const cwd = '';

	const baseConfig: FlatESLintConfig[] = [
		{
			ignores: DEFAULT_IGNORES,
		},
		{
			files: [JS_FILES_GLOB],
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
					espree: DEFAULT_EXTENSION,
				},
				'import/resolver': {
					node: true,
				},
			},
			rules,
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
	for (const config of userConfigs ?? []) {
		if (Object.keys(config).length === 0) {
			continue;
		}

		/**
     * Special case
     * string of built in recommended configs
     */
		if (typeof config === 'string') {
			baseConfig.push(config);
			continue;
		}

		/**
     * Special case
     * global ignores
     */
		if (
			Object.keys(config).length === 1
      && Object.keys(config)[0] === 'ignores'
		) {
			// accept ignores as a string or array of strings for user convenience
			config.ignores = arrify(config.ignores);
			baseConfig.push(config);
			continue;
		}

		if (config.files === undefined) {
			config.files = [JS_FILES_GLOB];
		}

		const tsConfig: Required<Pick<XoConfigItem, 'rules'>> & XoConfigItem = {
			files: [TS_FILES_GLOB],
			rules: {},
		};

		if (!config.rules) {
			// set up a default rules object to potentially add to if needed
			config.rules = {};
		}

		if (config.semicolon === false) {
			tsConfig.rules['@typescript-eslint/semi'] = ['error', 'never'];
			config.rules.semi = ['error', 'never'];
			config.rules['semi-spacing'] = [
				'error',
				{
					before: false,
					after: true,
				},
			];
		}

		if (config.space) {
			const spaces = typeof config.space === 'number' ? config.space : 2;

			config.rules = {
				...config.rules,
				indent: ['error', spaces, {SwitchCase: 1}],
			};
			tsConfig.rules = {
				...tsConfig.rules,
				'@typescript-eslint/indent': ['error', spaces, {SwitchCase: 1}],
			};
		} else if (config.space === false) {
			// if a user set this false for a small subset of files for some reason,
			// then we need to set them back to their original values
			config.rules = {
				...config.rules,
				indent: configXo?.rules?.['indent'],
			};

			tsConfig.rules = {
				...tsConfig.rules,
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
				(config.semicolon && prettierOptions['semi'] === false)
        ?? (!config.semicolon && prettierOptions['semi'] === true)
			) {
				throw new Error(
					// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
					`The Prettier config \`semi\` is ${prettierOptions['semi']} while XO \`semicolon\` is ${config.semicolon}`,
				);
			}

			if (
				((config.space ?? typeof config.space === 'number')
          && prettierOptions['useTabs'] === true)
        || (!config.space && prettierOptions['useTabs'] === false)
			) {
				throw new Error(
					// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
					`The Prettier config \`useTabs\` is ${prettierOptions['useTabs']} while XO \`space\` is ${config.space}`,
				);
			}

			if (
				typeof config.space === 'number'
        && typeof prettierOptions['tabWidth'] === 'number'
        && config.space !== prettierOptions['tabWidth']
			) {
				throw new Error(
					`The Prettier config \`tabWidth\` is ${prettierOptions['tabWidth']} while XO \`space\` is ${config.space}`,
				);
			}

			config.plugins = {
				...config.plugins,
				prettier: pluginPrettier,
			};

			config.rules = {
				...config.rules,
				...pluginPrettier.configs?.['recommended']?.rules,
				'prettier/prettier': [
					'error',
					{
						singleQuote: true,
						bracketSpacing: false,
						bracketSameLine: false,
						trailingComma: 'all',
						tabWidth: typeof config.space === 'number' ? config.space : 2,
						useTabs: !config.space,
						semi: config.semicolon,
						...prettierOptions,
					},
				],
				...configPrettier.rules,
			};
		} else if (_prettier === false) {
			// turn prettier off for a subset of files
			config.rules = {
				...config.rules,
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

		baseConfig.push(pick(config, options));
		if (!isEmpty(tsConfig.rules)) {
			baseConfig.push(pick(tsConfig, options));
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
				project: './tsconfig.json', // tsconfig,
			},
		},
		settings: {
			'import/resolver': {
				typescript: true,
			},
			'@typescript-eslint/parser': TYPESCRIPT_EXTENSION,
		},
	});

	return baseConfig;
}

export default createConfig;
