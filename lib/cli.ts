#!/usr/bin/env node
import process from 'node:process';
import path from 'node:path';
import meow from 'meow';
import formatterPretty, {type LintResult} from 'eslint-formatter-pretty';
import {type Rule} from 'eslint';
import type {LintOptions} from './types.js';
import xo from './index.js';

const cli = meow(
  `
	Usage
	  $ xo [<file|glob> ...]

	Options
	  --fix             Automagically fix issues
	  --space           Use space indent instead of tabs  [Default: 2]
	  --no-semicolon    Prevent use of semicolons
	  --prettier        Conform to Prettier code style
	  --print-config    Print the effective ESLint config for the given file
    --ignore          Ignore pattern globs, can be set multiple times
	  --cwd=<dir>       Working directory for files

	Examples
	  $ xo
	  $ xo index.js
	  $ xo *.js !foo.js
	  $ xo --space
	  $ xo --print-config=index.js

	Tips
	  - Add XO to your project with \`npm init xo\`.
	  - Put options in package.json instead of using flags so other tools can read it.
`,
  {
    importMeta: import.meta,
    autoVersion: false,
    booleanDefault: undefined,
    flags: {
      fix: {
        type: 'boolean',
      },
      reporter: {
        type: 'string',
      },
      env: {
        type: 'string',
        isMultiple: true,
      },
      global: {
        type: 'string',
        isMultiple: true,
      },
      ignore: {
        type: 'string',
        isMultiple: true,
      },
      space: {
        type: 'string',
      },
      semicolon: {
        type: 'boolean',
      },
      prettier: {
        type: 'boolean',
      },
      cwd: {
        type: 'string',
        default: process.cwd(),
      },
      printConfig: {
        type: 'string',
      },
      version: {
        type: 'boolean',
      },
    },
  },
);

const {input, flags: cliOptions, showVersion} = cli;

const lintOptions: LintOptions = {
  space: false,
  semicolon: false,
  prettier: false,
  cwd: (cliOptions.cwd && path.resolve(cliOptions.cwd)) ?? process.cwd(),
};

// Make data types for `options.space` match those of the API
if (typeof cliOptions.space === 'string') {
  if (/^\d+$/u.test(cliOptions.space)) {
    lintOptions.space = Number.parseInt(cliOptions.space, 10);
  } else if (cliOptions.space === 'true') {
    lintOptions.space = true;
  } else if (cliOptions.space === 'false') {
    lintOptions.space = false;
  } else {
    if (cliOptions.space !== '') {
      // Assume `options.space` was set to a filename when run as `xo --space file.js`
      input.push(cliOptions.space);
    }

    lintOptions.space = true;
  }
}

// if (process.env['GITHUB_ACTIONS'] && !options.fix && !options.reporter) {
//   options.quiet = true;
// }

const log = async (report: {
  results: Array<Readonly<LintResult>>;
  rulesMeta: Record<string, Rule.RuleMetaData>;
  errorCount?: number;
}) => {
  // @ts-expect-error readonly stuff is annoying
  const reporter: typeof formatterPretty = options.reporter
    ? await xo.getFormatter(cliOptions.reporter ?? 'compact')
    : formatterPretty;

  process.stdout.write(
    reporter(report.results, {
      rulesMeta: report.rulesMeta,
    }),
  );
  process.exitCode = report.errorCount === 0 ? 0 : 1;
};

if (cliOptions.version) {
  showVersion();
}

if (typeof cliOptions.printConfig === 'string') {
  if (input.length > 0 || cliOptions.printConfig === '') {
    console.error(
      'The `--print-config` flag must be used with exactly one filename',
    );
    process.exit(1);
  }

  lintOptions.filePath = cliOptions.printConfig;

  const config = await xo.getConfig(cliOptions);
  console.log(JSON.stringify(config, undefined, '\t'));
} else {
  const report = await xo.lintFiles(input, lintOptions);

  if (cliOptions.fix) {
    await xo.outputFixes(report);
  }

  await log(report);
}
