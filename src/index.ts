import { IApi, IRoute } from 'umi';
import { join } from 'path';
import { merge } from 'lodash';
import outdent from 'outdent';
import { format, resolveConfig } from 'prettier';
import { getDefaultOptions } from './generator/utils';
import { generateCode } from './generator/generate';

interface PluginConfig {
  name: string;
}

export default (api: IApi, opts: PluginConfig) => {
  api.describe({
    key: 'typedroute',
    config: {
      schema(joi) {
        return joi.boolean();
      },
    },
  });

  api.onGenerateFiles({
    fn: async () => {
      const {
        paths: { cwd },
        logger,
      } = api;

      const routes = await api.getRoutes();

      const prettierConfig = join(cwd || '.', '.prettierrc.js');

      const options = merge(getDefaultOptions(), opts);

      const codeString = await prettifyCode(
        outdent`
        ${generateCode(routes, options.variableName)}
      `,
        prettierConfig,
      );

      api.writeTmpFile({
        path: 'plugin-typed-route/typedRoute.ts',
        content: codeString,
      });
    },
  });

  api.addUmiExports(() => [{ exportAll: true, source: '../plugin-typed-route/typedRoute' }]);
};

async function prettifyCode(codeString: string, prettierConfig: string): Promise<string> {
  if (typeof prettierConfig === 'string') {
    try {
      const config = await resolveConfig(prettierConfig);
      return format(codeString, { ...config, parser: 'typescript' });
    } catch (e) {
      console.error(e);
    }
  }

  return format(codeString, { parser: 'typescript' });
}

export { makePathsFrom, Params } from './generator/path-utils';
