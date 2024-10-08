import type {XoConfigItem} from './lib/types.js';

const config: XoConfigItem[] = [
  {ignores: ['test/fixtures/**/*']},
  {
    space: true,
    rules: {
      '@typescript-eslint/naming-convention': 'off',
      'ava/no-ignored-test-files': 'off',
    },
  },
];

export default config;
