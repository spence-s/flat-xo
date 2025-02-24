import {type FlatXoConfig} from './index.js';

const xoConfig: FlatXoConfig = [
	{ignores: ['test/fixtures/**/*']},
	{
		rules: {
			'@typescript-eslint/naming-convention': 'off',
			'ava/no-ignored-test-files': 'off',
			'capitalized-comments': 'off',
		},
	},
];

export default xoConfig;
