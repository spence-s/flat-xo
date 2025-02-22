import path from 'node:path';
import prettier, {type Options} from 'prettier';
import {type Linter, type ESLint} from 'eslint';
import pluginPrettier from 'eslint-plugin-prettier';
import configPrettier from 'eslint-config-prettier';
import {type XoConfigItem} from '../types.js';

/**
 * Looks up prettier options and adds them to the eslint config, if they conflict with the xo config, throws an error.
 * Does not handle prettier overrides but will not fail for them in case they are setup to handle non js/ts files.
 *
 * Mutates the eslintConfigItem
 *
 * @param cwd
 * @param xoUserConfig
 * @param eslintConfigItem
 */
export async function handlePrettierOptions(cwd: string, xoUserConfig: XoConfigItem, eslintConfigItem: Linter.Config): Promise<void> {
	const prettierOptions: Options = await prettier.resolveConfig(path.join(cwd, 'xo.config.js'), {editorconfig: true}) ?? {};

	// validate that prettier options match other xoConfig options
	if ((xoUserConfig.semicolon && prettierOptions.semi === false) ?? (!xoUserConfig.semicolon && prettierOptions.semi === true)) {
		throw new Error(`The Prettier config \`semi\` is ${prettierOptions.semi} while XO \`semicolon\` is ${xoUserConfig.semicolon}, also check your .editorconfig for inconsistencies.`);
	}

	if (((xoUserConfig.space ?? typeof xoUserConfig.space === 'number') && prettierOptions.useTabs === true) || (!xoUserConfig.space && prettierOptions.useTabs === false)) {
		throw new Error(`The Prettier config \`useTabs\` is ${prettierOptions.useTabs} while XO \`space\` is ${xoUserConfig.space}, also check your .editorconfig for inconsistencies.`);
	}

	if (typeof xoUserConfig.space === 'number' && typeof prettierOptions.tabWidth === 'number' && xoUserConfig.space !== prettierOptions.tabWidth) {
		throw new Error(`The Prettier config \`tabWidth\` is ${prettierOptions.tabWidth} while XO \`space\` is ${xoUserConfig.space}, also check your .editorconfig for inconsistencies.`);
	}

	// Add prettier plugin
	eslintConfigItem.plugins = {
		...eslintConfigItem.plugins,
		prettier: pluginPrettier,
	};

	// configure prettier rules
	eslintConfigItem.rules = {
		...eslintConfigItem.rules,
		...(pluginPrettier.configs?.['recommended'] as ESLint.ConfigData)
			?.rules,
		'prettier/prettier': [
			'error',
			{
				singleQuote: true,
				bracketSpacing: false,
				bracketSameLine: false,
				trailingComma: 'all',
				tabWidth:
        typeof xoUserConfig.space === 'number' ? xoUserConfig.space : 2,
				useTabs: !xoUserConfig.space,
				semi: xoUserConfig.semicolon,
				...prettierOptions,
			},
		],
		...configPrettier.rules,
	};
}
