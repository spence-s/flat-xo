import process from 'node:process';
import pkg from 'eslint/use-at-your-own-risk';
import createConfig from './config.js';

const {FlatESLint} = pkg;

const eslint = new FlatESLint({
	cwd: process.cwd(),
	overrideConfigFile: true,
	overrideConfig: createConfig(),
});

const lintText = async (files, options) => {
	const {filePath, warnIgnored} = options || {};

	const results = await eslint.lintText(files, {filePath, warnIgnored});

	// Console.log(results);

	return {
		results,
		...results[0],
	};
};

export default {
	lintText,
};
