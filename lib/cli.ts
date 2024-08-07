#!/usr/bin/env node
import path from 'node:path';
import process from 'node:process';
import {type Rule} from 'eslint';
import formatterPretty, {type LintResult} from 'eslint-formatter-pretty';
import meow from 'meow';
import type {LintOptions} from './types.js';
import {XO} from './xo.js';

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
`,
  {
    importMeta: import.meta,
    autoVersion: false,
    booleanDefault: undefined,
    flags: {
      fix: {
        type: 'boolean',
      },
      tsconfig: {
        aliases: ['tsConfig'],
        type: 'string',
      },
      reporter: {
        type: 'string',
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
      ignore: {
        type: 'string',
        isMultiple: true,
      },
    },
  },
);

export type CliOptions = typeof cli;

const {input, flags: cliOptions, showVersion} = cli;

const lintOptions: LintOptions = {
  space: cliOptions.space,
  semicolon: cliOptions.semicolon,
  prettier: cliOptions.prettier,
  cwd: (cliOptions.cwd && path.resolve(cliOptions.cwd)) ?? process.cwd(),
  tsconfig: cliOptions.tsconfig,
  ignores: cliOptions.ignore,
  fix: cliOptions.fix,
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
  cwd: string;
  results: Array<Readonly<LintResult>>;
  rulesMeta: Record<string, Rule.RuleMetaData> & {cwd: string};
  errorCount?: number;
}) => {
  const reporter = formatterPretty;
  // cliOptions.reporter
  // ? await new XO(cliOptions).getFormatter(cliOptions.reporter ?? 'compact')
  // :

  // @ts-expect-error upgrade stuff
  console.log(reporter(report.results, report));

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

  const config = await new XO().calculateConfigForFile(lintOptions.filePath);
  console.log(JSON.stringify(config, undefined, '\t'));
} else {
  const xo = new XO(lintOptions);
  const timeStart = Date.now();
  await xo.initEslint(lintOptions.fix);
  const timeEnd = Date.now();
  console.warn(`ESLint took ${timeEnd - timeStart}ms to initialize`);
  const report = await xo.lintFiles(input);

  if (cliOptions.fix) {
    await XO.outputFixes(report);
  }

  // @ts-expect-error idk man
  await log(report);
}
