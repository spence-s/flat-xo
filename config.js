import process from 'node:process';
import configXo from 'eslint-config-xo';
import pluginAva from 'eslint-plugin-ava';
import pluginUnicorn from 'eslint-plugin-unicorn';
import pluginImport from 'eslint-plugin-import';
import pluginN from 'eslint-plugin-n';
import pluginComments from 'eslint-plugin-eslint-comments';
import pluginNoUseExtendNative from 'eslint-plugin-no-use-extend-native';
import configXoTypescript from 'eslint-config-xo-typescript';
import pluginTypescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export const defaultConfig = [{
	prettier: false,
	space: false,
	semi: true,
	cwd: process.cwd(),
	nodeVersion: false,
	webpack: false,
}];

const basePlugins = {
	'no-use-extend-native': pluginNoUseExtendNative,
	ava: pluginAva,
	unicorn: pluginUnicorn,
	import: pluginImport,
	n: pluginN,
	'eslint-comments': pluginComments,
};

const baseConfig = [
	{
		files: ['**/*.{js,jsx,mjs,cjs}'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
		},
		settings: {
			'import/core-modules': ['electron', 'atom'],
		},
		plugins: basePlugins,
		rules: {
			...pluginAva.configs.recommended.rules,
			...pluginUnicorn.configs.recommended.rules,
			...configXo.rules,
		},
	},
	{
		files: ['**/*.{ts,tsx,mts,cts}'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			parser: typescriptParser,
		},
		plugins: {...basePlugins, '@typescript-eslint': pluginTypescript},
		rules: {
			...pluginAva.configs.recommended.rules,
			...pluginUnicorn.configs.recommended.rules,
			...configXo.rules,
			...configXoTypescript.rules,
		},
	},
];

/**
 * Takes a xo flat config and returns an eslint flat config
 */
function createConfig(configs) {
	return [...baseConfig, ...(configs ?? []).map(config => getEslintFlatConfigItemFromXoConfigItem(config))];
}

function getEslintFlatConfigItemFromXoConfigItem(
	xoConfigItem,
) {
	const eslintConfigItem = {
		files: xoConfigItem.files,
		ignores: xoConfigItem.ignores,
		languageOptions: xoConfigItem.languageOptions,
		settings: xoConfigItem.languageOptions,
		plugins: xoConfigItem.plugins,
		rules: {
			...xoConfigItem.rules,
		},
	};

	return eslintConfigItem;
}

export default createConfig;
