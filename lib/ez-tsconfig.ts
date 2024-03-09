import {getTsconfig, type TsConfigResult} from 'get-tsconfig';

function ezTsconfig(
  cwd: string,
  givenPath?: string,
): TsConfigResult | undefined {
  const parsedTsconfig = getTsconfig(givenPath ?? cwd);

  if (!parsedTsconfig) {
    return;
  }

  return parsedTsconfig;
}

export default ezTsconfig;
