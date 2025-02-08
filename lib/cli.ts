#!/usr/bin/env node
// no-use-extend-native plugin creates an experimental warning so we silence it
// https://github.com/nodejs/node/issues/30810#issuecomment-1893682691

import path from 'node:path';
import process from 'node:process';
import {type Rule, type ESLint} from 'eslint';
import formatterPretty from 'eslint-formatter-pretty';
import getStdin from 'get-stdin';
// eslint-disable-next-line import-x/no-named-default
import {default as meow} from 'meow';
import _debug from 'debug';
import type {LinterOptions, XoConfigOptions} from './types.js';
import {XO} from './xo.js';
import openReport from './open-report.js';

const debug = _debug('xo:cli');

const cli = meow(
  `
  Usage
    $ xo [<file|glob> ...]

  Options
    --fix             Automagically fix issues
    --space           Use space indent instead of tabs [Default: 2]
    --semicolon       Use semicolons [Default: true]
    --prettier        Conform to Prettier code style [Default: false]
    --react           Include React specific parsing and xo-react linting rules [Default: false]
    --prettier        Format with prettier or turn off prettier conflicted rules when set to 'compat' [Default: false]
    --ts              Auto configure type aware linting on unincluded ts files [Default: true]
    --print-config    Print the effective ESLint config for the given file
    --open            Open files with issues in your editor
    --stdin           Validate/fix code from stdin
    --stdin-filename  Specify a filename for the --stdin option
    --ignore          Ignore pattern globs, can be set multiple times
    --cwd=<dir>       Working directory for files [Default: process.cwd()]

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
        default: false,
      },
      reporter: {
        type: 'string',
      },
      space: {
        type: 'string',
      },
      config: {
        type: 'string',
      },
      quiet: {
        type: 'boolean',
      },
      semicolon: {
        type: 'boolean',
      },
      prettier: {
        type: 'boolean',
      },
      ts: {
        type: 'boolean',
        default: true,
      },
      react: {
        type: 'boolean',
        default: false,
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
      stdin: {
        type: 'boolean',
      },
      stdinFilename: {
        type: 'string',
      },
      open: {
        type: 'boolean',
      },
      ignore: {
        type: 'string',
        isMultiple: true,
        aliases: ['ignores'],
      },
    },
  },
);

export type CliOptions = typeof cli;

const {input, flags: cliOptions, showVersion} = cli;

const baseXoConfigOptions: XoConfigOptions = {
  space: cliOptions.space,
  semicolon: cliOptions.semicolon,
  prettier: cliOptions.prettier,
  ignores: cliOptions.ignore,
  react: cliOptions.react,
};

const linterOptions: LinterOptions = {
  fix: cliOptions.fix,
  cwd: (cliOptions.cwd && path.resolve(cliOptions.cwd)) ?? process.cwd(),
  quiet: cliOptions.quiet,
  ts: cliOptions.ts,
};

// Make data types for `options.space` match those of the API
if (typeof cliOptions.space === 'string') {
  cliOptions.space = cliOptions.space.trim();

  if (/^\d+$/u.test(cliOptions.space)) {
    baseXoConfigOptions.space = Number.parseInt(cliOptions.space, 10);
  } else if (cliOptions.space === 'true') {
    baseXoConfigOptions.space = true;
  } else if (cliOptions.space === 'false') {
    baseXoConfigOptions.space = false;
  } else {
    if (cliOptions.space !== '') {
      // Assume `options.space` was set to a filename when run as `xo --space file.js`
      input.push(cliOptions.space);
    }

    baseXoConfigOptions.space = true;
  }
}

if (
  process.env['GITHUB_ACTIONS']
  && !linterOptions.fix
  && !cliOptions.reporter
) {
  linterOptions.quiet = true;
}

const log = async (report: {
  errorCount: number;
  warningCount: number;
  fixableErrorCount: number;
  fixableWarningCount: number;
  results: ESLint.LintResult[];
  rulesMeta: Record<string, Rule.RuleMetaData>;
}) => {
  const reporter
  = cliOptions.reporter
    ? await new XO(linterOptions, baseXoConfigOptions).getFormatter(cliOptions.reporter)
    : {format: formatterPretty};

  // @ts-expect-error the types don't quite match up here
  console.log(reporter.format(report.results, {cwd: linterOptions.cwd, ...report}));

  process.exitCode = report.errorCount === 0 ? 0 : 1;
};

if (cliOptions.version) {
  showVersion();
}

if (cliOptions.stdin) {
  if (!cliOptions.stdinFilename) {
    console.error('The `--stdin-filename` flag must be used with `--stdin`');
    process.exit(1);
  }

  const stdin = await getStdin();

  if (cliOptions.fix) {
    const xo = new XO(linterOptions, baseXoConfigOptions);
    const {results: [result]} = await xo.lintText(stdin, {
      filePath: cliOptions.stdinFilename,
    });
    process.stdout.write((result?.output) ?? stdin);
    process.exit(0);
  }

  if (cliOptions.open) {
    console.error('The `--open` flag is not supported on stdin');
    process.exit(1);
  }

  const xo = new XO(linterOptions, baseXoConfigOptions);
  await log(await xo.lintText(stdin, {filePath: cliOptions.stdinFilename}));
}

if (typeof cliOptions.printConfig === 'string') {
  if (input.length > 0 || cliOptions.printConfig === '') {
    console.error('The `--print-config` flag must be used with exactly one filename');
    process.exit(1);
  }

  const config = await new XO(linterOptions, baseXoConfigOptions).calculateConfigForFile(cliOptions.printConfig);
  console.log(JSON.stringify(config, undefined, '\t'));
} else {
  debug('linterOptions %O', linterOptions);
  const xo = new XO(linterOptions, baseXoConfigOptions);

  const report = await xo.lintFiles(input);
  debug('xo.lintFiles success');

  if (cliOptions.fix) {
    await XO.outputFixes(report);
    debug('xo.outputFixes success');
  }

  if (cliOptions.open) {
    await openReport(report);
  }

  await log(report);
}
