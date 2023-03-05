declare module 'eslint/use-at-your-own-risk' {
  import {type FlatESLintConfig} from 'eslint-define-config';

  export class FlatESLint {
    cwd: string;
    overrideConfigFile: boolean;
    overrideConfig: FlatESLintConfig;
    cache: boolean;
    cacheLocation: string;
  }
}

declare module 'eslint-plugin-ava' {
  import {type ESLint} from 'eslint';
  import {type ESLintConfig} from 'eslint-define-config';

  const plugin: Omit<ESLint.Plugin, 'configs'> & {
    configs: Record<string, ESLintConfig>;
  };
  export default plugin;
}

declare module 'eslint-plugin-unicorn' {
  import {type ESLint} from 'eslint';
  import {type ESLintConfig} from 'eslint-define-config';

  const plugin: Omit<ESLint.Plugin, 'configs'> & {
    configs: Record<string, ESLintConfig>;
  };
  export default plugin;
}

declare module 'eslint-plugin-import' {
  import {type ESLint} from 'eslint';
  import {type ESLintConfig} from 'eslint-define-config';

  const plugin: Omit<ESLint.Plugin, 'configs'> & {
    configs: Record<string, ESLintConfig>;
  };
  export default plugin;
}

declare module 'eslint-plugin-n' {
  import {type ESLint} from 'eslint';
  import {type ESLintConfig} from 'eslint-define-config';

  const plugin: Omit<ESLint.Plugin, 'configs'> & {
    configs: Record<string, ESLintConfig>;
  };
  export default plugin;
}

declare module 'eslint-plugin-eslint-comments' {
  import {type ESLint} from 'eslint';
  import {type ESLintConfig} from 'eslint-define-config';

  const plugin: Omit<ESLint.Plugin, 'configs'> & {
    configs: Record<string, ESLintConfig>;
  };
  export default plugin;
}

declare module 'eslint-plugin-no-use-extend-native' {
  import {type ESLint} from 'eslint';
  import {type ESLintConfig} from 'eslint-define-config';

  const plugin: Omit<ESLint.Plugin, 'configs'> & {
    configs: Record<string, ESLintConfig>;
  };
  export default plugin;
}

declare module 'eslint-plugin-prettier' {
  import {type ESLint} from 'eslint';
  import {type ESLintConfig} from 'eslint-define-config';

  const plugin: Omit<ESLint.Plugin, 'configs'> & {
    configs: Record<string, ESLintConfig>;
  };
  export default plugin;
}

declare module 'eslint-config-xo-typescript' {
  import {type ESLintConfig} from 'eslint-define-config';

  const config: ESLintConfig;
  export default config;
}

declare module 'eslint-config-xo' {
  import {type ESLintConfig} from 'eslint-define-config';

  const config: ESLintConfig;
  export default config;
}

declare module 'eslint-config-prettier' {
  import {type ESLintConfig} from 'eslint-define-config';

  const config: ESLintConfig;
  export default config;
}