#!/usr/bin/env node
/* eslint-disable unicorn/prefer-top-level-await */
import process from 'node:process';
import path from 'node:path';
import getStdin from 'get-stdin';
import meow from 'meow';
import formatterPretty, {type LintResult} from 'eslint-formatter-pretty';
import semver from 'semver';
import type {ESLint} from 'eslint';
import type {CliOptions} from './types.js';
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
	  --cwd=<dir>       Working directory for files
	  --print-config    Print the effective ESLint config for the given file

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
      },
      printConfig: {
        type: 'string',
      },
    },
  },
);

const {input, flags, showVersion} = cli;

const options = flags;

const cliOptions: CliOptions = {
  space: false,
  semicolon: false,
  prettier: false,
  cwd: (flags.cwd && path.resolve(flags.cwd)) ?? process.cwd(),
};

// Make data types for `options.space` match those of the API
if (typeof options.space === 'string') {
  if (/^\d+$/u.test(options.space)) {
    cliOptions.space = Number.parseInt(options.space, 10);
  } else if (options.space === 'true') {
    cliOptions.space = true;
  } else if (options.space === 'false') {
    cliOptions.space = false;
  } else {
    if (options.space !== '') {
      // Assume `options.space` was set to a filename when run as `xo --space file.js`
      input.push(options.space);
    }

    cliOptions.space = true;
  }
}

if (process.env['GITHUB_ACTIONS'] && !options.fix && !options.reporter) {
  options.quiet = true;
}

const log = async (report: {results: LintResult}) => {
  const reporter: ESLint.Formatter =
    options.reporter || process.env['GITHUB_ACTIONS']
      ? await xo.getFormatter(options.reporter || 'compact')
      : formatterPretty;
  process.stdout.write(
    reporter(report.results, {
      rulesMeta: report.rulesMeta,
      cwd: options.cwd ?? process.cwd(),
    }),
  );
  process.exitCode = report.errorCount === 0 ? 0 : 1;
};

// `xo -` => `xo --stdin`
if (input[0] === '-') {
  options.stdin = true;
  input.shift();
}

if (options.version) {
  showVersion();
}

if (options.nodeVersion) {
  if (options.nodeVersion === 'false') {
    options.nodeVersion = false;
  } else if (
    typeof options.nodeVersion === 'string' &&
    !semver.validRange(options.nodeVersion)
  ) {
    console.error(
      'The `--node-engine` flag must be a valid semver range (for example `>=6`)',
    );
    process.exit(1);
  }
}

(async () => {
  if (typeof options.printConfig === 'string') {
    if (input.length > 0 || options.printConfig === '') {
      console.error(
        'The `--print-config` flag must be used with exactly one filename',
      );
      process.exit(1);
    }

    if (options.stdin) {
      console.error('The `--print-config` flag is not supported on stdin');
      process.exit(1);
    }

    options.filePath = options.printConfig;

    const config = await xo.getConfig(options);
    console.log(JSON.stringify(config, undefined, '\t'));
  } else if (options.stdin) {
    const stdin = await getStdin();

    if (options.stdinFilename) {
      options.filePath = options.stdinFilename;
    }

    if (options.fix) {
      const {
        results: [result],
      } = await xo.lintText(stdin, options);
      // If there is no output, pass the stdin back out
      process.stdout.write((result && result.output) || stdin);
      return;
    }

    if (options.open) {
      console.error('The `--open` flag is not supported on stdin');
      process.exit(1);
    }

    await log(await xo.lintText(stdin, options));
  } else {
    const report = await xo.lintFiles(input, options);

    if (options.fix) {
      await xo.outputFixes(report);
    }

    await log(report);
  }
})();
