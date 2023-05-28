import {TS_FILES_GLOB} from './dist/lib/constants.js';

const config = [
	{
		files: [TS_FILES_GLOB],
		rules: {
			'@typescript-eslint/naming-convention': 'off',
		},
	},
];

export default config;
