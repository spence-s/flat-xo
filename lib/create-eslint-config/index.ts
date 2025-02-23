/* eslint-disable complexity */
import configXoTypescript from 'eslint-config-xo-typescript';
import arrify from 'arrify';
import {type Linter, type ESLint} from 'eslint';
import configReact from 'eslint-config-xo-react';
import {type Options} from 'prettier';
import pluginPrettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';
import {type FlatXoConfig} from '../types.js';
import {config} from './base-config.js';
import {xoToEslintConfigItem} from './xo-to-eslint-config-item.js';

export type CreateConfigOptions = {
	prettierOptions?: Options;
};
/**
 * Takes a xo flat config and returns an eslint flat config
 */
export async function createConfig(userConfigs: FlatXoConfig | undefined, {prettierOptions = {}}: CreateConfigOptions = {}): Promise<Linter.Config[]> {
	const baseConfig = [...config];
	/**
   * Since configs are merged and the last config takes precedence
   * this means we need to handle both true AND false cases for each option.
   * ie... we need to turn prettier,space,semi,etc... on or off for a specific file
   */
	for (const xoUserConfigItem of userConfigs ?? []) {
		const keysOfXoConfig = Object.keys(xoUserConfigItem);

		if (keysOfXoConfig.length === 0) {
			continue;
		}

		/** Special case global ignores */
		if (keysOfXoConfig.length === 1 && keysOfXoConfig[0] === 'ignores') {
			baseConfig.push({ignores: arrify(xoUserConfigItem.ignores)});
			continue;
		}

		/**  An eslint config item derived from the xo config item with rules and files initialized */
		const eslintConfigItem = xoToEslintConfigItem(xoUserConfigItem);

		if (xoUserConfigItem.semicolon === false) {
			eslintConfigItem.rules['@stylistic/semi'] = ['error', 'never'];
			eslintConfigItem.rules['@stylistic/semi-spacing'] = [
				'error',
				{before: false, after: true},
			];
		}

		if (xoUserConfigItem.space) {
			const spaces
        = typeof xoUserConfigItem.space === 'number' ? xoUserConfigItem.space : 2;
			eslintConfigItem.rules['@stylistic/indent'] = [
				'error',
				spaces,
				{SwitchCase: 1},
			];
		} else if (xoUserConfigItem.space === false) {
			// If a user set this false for a small subset of files for some reason,
			// then we need to set them back to their original values
			eslintConfigItem.rules['@stylistic/indent']
        = configXoTypescript[1]?.rules?.['@stylistic/indent'];
		}

		if (xoUserConfigItem.prettier) {
			if (xoUserConfigItem.prettier === 'compat') {
				baseConfig.push({files: eslintConfigItem.files, ...eslintConfigPrettier});
			} else {
				// validate that prettier options match other xoConfig options
				if ((xoUserConfigItem.semicolon && prettierOptions.semi === false) ?? (!xoUserConfigItem.semicolon && prettierOptions.semi === true)) {
					// eslint-disable-next-line @stylistic/max-len
					throw new Error(`The Prettier config \`semi\` is ${prettierOptions.semi} while XO \`semicolon\` is ${xoUserConfigItem.semicolon}, also check your .editorconfig for inconsistencies.`);
				}

				if (((xoUserConfigItem.space ?? typeof xoUserConfigItem.space === 'number') && prettierOptions.useTabs === true) || (!xoUserConfigItem.space && prettierOptions.useTabs === false)) {
					// eslint-disable-next-line @stylistic/max-len
					throw new Error(`The Prettier config \`useTabs\` is ${prettierOptions.useTabs} while XO \`space\` is ${xoUserConfigItem.space}, also check your .editorconfig for inconsistencies.`);
				}

				if (typeof xoUserConfigItem.space === 'number' && typeof prettierOptions.tabWidth === 'number' && xoUserConfigItem.space !== prettierOptions.tabWidth) {
					// eslint-disable-next-line @stylistic/max-len
					throw new Error(`The Prettier config \`tabWidth\` is ${prettierOptions.tabWidth} while XO \`space\` is ${xoUserConfigItem.space}, also check your .editorconfig for inconsistencies.`);
				}

				// Add prettier plugin
				eslintConfigItem.plugins = {
					...eslintConfigItem.plugins,
					prettier: pluginPrettier,
				};

				const prettierConfig = {
					singleQuote: true,
					bracketSpacing: false,
					bracketSameLine: false,
					trailingComma: 'all',
					tabWidth: typeof xoUserConfigItem.space === 'number' ? xoUserConfigItem.space : 2,
					useTabs: !xoUserConfigItem.space,
					semi: xoUserConfigItem.semicolon,
					...prettierOptions,
				};

				// configure prettier rules
				const rulesWithPrettier: Linter.RulesRecord = {
					...eslintConfigItem.rules,
					...(pluginPrettier.configs?.['recommended'] as ESLint.ConfigData)?.rules,
					'prettier/prettier': ['error', prettierConfig],
					...eslintConfigPrettier.rules,
				};

				eslintConfigItem.rules = rulesWithPrettier;
			}
		} else if (xoUserConfigItem.prettier === false) {
			// Turn prettier off for a subset of files
			eslintConfigItem.rules['prettier/prettier'] = 'off';
		}

		if (xoUserConfigItem.react) {
			// ensure the files applied to the react config are the same as the config they are derived from
			baseConfig.push({files: eslintConfigItem.files, ...configReact[0]});
		}

		baseConfig.push(eslintConfigItem);
	}

	return baseConfig;
}

export default createConfig;
