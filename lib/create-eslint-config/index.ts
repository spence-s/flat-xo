import process from 'node:process';
import configXoTypescript from 'eslint-config-xo-typescript';
import arrify from 'arrify';
import {type Linter} from 'eslint';
import configReact from 'eslint-config-xo-react';
import eslintConfigPrettier from 'eslint-config-prettier';
import {type XoConfigItem} from '../types.js';
import {config} from './config.js';
import {xoToEslintConfigItem} from './xo-to-eslint.js';
import {handlePrettierOptions} from './prettier.js';

/**
 * Takes a xo flat config and returns an eslint flat config
 */
export async function createConfig(
  userConfigs?: XoConfigItem[],
  cwd?: string,
): Promise<Linter.Config[]> {
  const baseConfig = [...config];
  /**
   * Since configs are merged and the last config takes precedence
   * this means we need to handle both true AND false cases for each option.
   * ie... we need to turn prettier,space,semi,etc... on or off for a specific file
   */
  for (const xoUserConfig of userConfigs ?? []) {
    const keysOfXoConfig = Object.keys(xoUserConfig);

    if (keysOfXoConfig.length === 0) {
      continue;
    }

    /** Special case global ignores */
    if (keysOfXoConfig.length === 1 && keysOfXoConfig[0] === 'ignores') {
      baseConfig.push({ignores: arrify(xoUserConfig.ignores)});
      continue;
    }

    /**  An eslint config item derived from the xo config item with rules and files initialized */
    const eslintConfigItem = xoToEslintConfigItem(xoUserConfig);

    if (xoUserConfig.semicolon === false) {
      eslintConfigItem.rules['@stylistic/semi'] = ['error', 'never'];
      eslintConfigItem.rules['@stylistic/semi-spacing'] = [
        'error',
        {before: false, after: true},
      ];
    }

    if (xoUserConfig.space) {
      const spaces
        = typeof xoUserConfig.space === 'number' ? xoUserConfig.space : 2;
      eslintConfigItem.rules['@stylistic/indent'] = [
        'error',
        spaces,
        {SwitchCase: 1},
      ];
    } else if (xoUserConfig.space === false) {
      // If a user set this false for a small subset of files for some reason,
      // then we need to set them back to their original values
      eslintConfigItem.rules['@stylistic/indent']
        = configXoTypescript[1]?.rules?.['@stylistic/indent'];
    }

    if (xoUserConfig.prettier) {
      if (xoUserConfig.prettier === 'compat') {
        baseConfig.push(eslintConfigPrettier);
      } else {
        // eslint-disable-next-line no-await-in-loop
        await handlePrettierOptions(
          cwd ?? process.cwd(),
          xoUserConfig,
          eslintConfigItem,
        );
      }
    } else if (xoUserConfig.prettier === false) {
      // Turn prettier off for a subset of files
      eslintConfigItem.rules['prettier/prettier'] = 'off';
    }

    if (xoUserConfig.react) {
      baseConfig.push(...configReact);
    }

    baseConfig.push(eslintConfigItem);
  }

  return baseConfig;
}

export default createConfig;
