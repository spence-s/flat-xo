import {XO} from './dist/lib/xo.js';

const xo = new XO({cwd: import.meta.dirname});

await xo.initEslint(['test.ts']);

export default xo.eslintConfig;
