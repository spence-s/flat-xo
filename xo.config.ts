import type {XoConfigItem} from './lib/types.js';

const config: XoConfigItem[] = [
  {ignores: ['test/fixtures/**/*']},
  {
    space: true,
    rules: {
      '@typescript-eslint/naming-convention': 'off',
      'ava/no-ignored-test-files': 'off',
      'capitalized-comments': 'off',
    },
  },
  {
    files: ['prettier-test.ts'],
    prettier: true,
  },
];

export default config;
