// @ts-check
import path from 'node:path';
import os from 'node:os';
import process from 'node:process';
import pkg from 'eslint/use-at-your-own-risk'; // eslint-disable-line n/file-extension-in-import
import findCacheDir from 'find-cache-dir';
import {cosmiconfig} from 'cosmiconfig';
import createConfig from './lib/config.js';

// @ts-ignore
const {FlatESLint} = pkg;

const CACHE_DIR_NAME = 'xo-linter';

class XO {
  static findXoConfig = async (options) => {
    const configExplorer = cosmiconfig('xo', {
      searchPlaces: [`xo.config.js`, `xo.config.cjs`],
      stopDir: options.cwd,
      loaders: {
        async '.js'(fp) {
          const {default: module} = await import(fp);
          return module;
        },
      },
    });
    const searchPath = options.filePath || options.cwd;
    const {config: xoOptions} = (await configExplorer.search(searchPath)) || {};
    return xoOptions;
  };

  constructor({cwd}, config) {
    this.eslint = new FlatESLint({
      cwd: process.cwd(),
      overrideConfigFile: true,
      overrideConfig: createConfig(config),
      cache: true,
      cacheLocation: path.join(
        findCacheDir({name: CACHE_DIR_NAME, cwd}) ||
          path.join(os.homedir() || os.tmpdir(), '.xo-cache/'),
        'flat-xo-cache.json',
      ),
    });
  }

  lintFiles = async (globs) => {
    const results = await this.eslint.lintFiles(globs);
    return {
      results,
      ...results[0],
    };
  };

  lintText = async (code, {filePath = '', warnIgnored = false} = {}) => {
    const results = await this.eslint.lintText(code, {filePath, warnIgnored});

    console.log(results);

    return {
      results,
      ...results[0],
    };
  };
}

export default XO;
