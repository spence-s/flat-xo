import type {FlatESLintConfigItem} from 'eslint-define-config';
import {type ESLint, type Rule} from 'eslint';

export type Space = boolean | number | string | undefined;

export type Normalize<Type> = {
	[Property in keyof Type as `${string & Property}s`]: Type[Property];
} & Type;

export type CliOptions = {
	fix?: boolean;
	reporter?: string;
	env?: string[];
	global?: string[];
	ignores?: string[];
	space?: Space;
	semicolon?: boolean;
	cwd?: string;
	version?: boolean;
	printConfig?: boolean;
};

export type XoOptions = {
	space?: Space;
	semicolon?: boolean;
	prettier?: boolean;
	tsconfig?: string;
	ignores?: string | string[];
};

export type LintOptions = XoOptions & {
	cwd?: string;
	filePath?: string;
	ezTs?: boolean;
};

export type GlobalOptions = XoOptions & FlatESLintConfigItem;

export type LintTextOptions = LintOptions & {warnIgnored?: boolean; forceInitialize?: boolean};

export type XoConfigItem = FlatESLintConfigItem & Partial<LintOptions>;

export type FlatXoConfig = XoConfigItem[];

export type XoLintResult = {
	results: ESLint.LintResult[];
	rulesMeta: Rule.RuleMetaData;
};
