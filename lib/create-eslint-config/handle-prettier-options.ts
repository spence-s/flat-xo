// eslint-disable-next-line import-x/no-named-default
import {default as prettier} from 'prettier';
import {type FlatESLintConfig} from 'eslint-define-config';
import pluginPrettier from 'eslint-plugin-prettier';
import {type ESLint} from 'eslint';
import configPrettier from 'eslint-config-prettier';
import {type XoConfigItem} from '../types.js';

let cachedPrettierConfig: Record<string, unknown>;

/**
 * Looks up prettier options and adds them to the eslint config, if they conflict with the xo config, throws an error
 *
 * Mutates the eslintConfigItem
 *
 * @param cwd
 * @param xoUserConfig
 * @param eslintConfigItem
 */
export async function handlePrettierOptions(cwd: string, xoUserConfig: XoConfigItem, eslintConfigItem: FlatESLintConfig): Promise<void> {
  const prettierOptions = cachedPrettierConfig ?? (await prettier.resolveConfig(cwd, {editorconfig: true})) ?? {};

  // Only look up prettier once per run
  cachedPrettierConfig = prettierOptions;

  // validate that prettier options match other xoConfig options
  if ((xoUserConfig.semicolon && prettierOptions['semi'] === false) ?? (!xoUserConfig.semicolon && prettierOptions['semi'] === true)) {
    throw new Error(`The Prettier config \`semi\` is ${prettierOptions['semi']} while XO \`semicolon\` is ${xoUserConfig.semicolon}`);
  }

  if (((xoUserConfig.space ?? typeof xoUserConfig.space === 'number') && prettierOptions['useTabs'] === true) || (!xoUserConfig.space && prettierOptions['useTabs'] === false)) {
    throw new Error(`The Prettier config \`useTabs\` is ${prettierOptions['useTabs']} while XO \`space\` is ${xoUserConfig.space}`);
  }

  if (typeof xoUserConfig.space === 'number' && typeof prettierOptions['tabWidth'] === 'number' && xoUserConfig.space !== prettierOptions['tabWidth']) {
    throw new Error(`The Prettier config \`tabWidth\` is ${prettierOptions['tabWidth']} while XO \`space\` is ${xoUserConfig.space}`);
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
