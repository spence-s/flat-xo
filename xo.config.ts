import type {FlatXoConfig} from './lib/types.js';

const xoConfig: FlatXoConfig = [
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

export default xoConfig;
