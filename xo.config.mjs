import {TS_FILES_GLOB} from './dist/lib/constants.js';

const config = [
	{
		ignores: ['test/fixtures'],
	},
	{
		files: [TS_FILES_GLOB],
		prettier: true,
		rules: {
			'@typescript-eslint/naming-convention': 'off',
			'capitalized-comments': 'off',
			'import/extensions': 'off',
		},
	},
];

export default config;
