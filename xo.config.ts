import type {XoConfigItem} from './lib/types.js';

const config: XoConfigItem[] = [
  {ignores: ['test/fixtures/**/*']},
  {
    space: true,
    prettier: true,
    files: [`**/*.{ts,js}`],
    rules: {
      '@typescript-eslint/naming-convention': 'off',
      'ava/no-ignored-test-files': 'off',
      // 'import-x/no-named-default': 'off',
    },
  },
];

export default config;
