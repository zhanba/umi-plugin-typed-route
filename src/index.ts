import { IApi, IRoute } from 'umi';
import { join } from 'path';
import { merge } from 'lodash';
import outdent from 'outdent';
import { format, resolveConfig } from 'prettier';
import { getDefaultOptions } from './generator/utils';
import { Paths } from './generator/types';
import { generateCode } from './generator/generate';

interface PluginConfig {
  name: string;
}

const getPathsFromRoutes = (routes: IRoute[]): Paths => {
  const paths: Paths = {};
  routes.forEach(route => {
    // 必须配置route的name属性，属性必须为英文
    if (route.name === undefined) {
      return;
    }
    const { routes: childRoutes } = route;
    if (childRoutes !== undefined && childRoutes.length > 0) {
      paths[route.name] = getPathsFromRoutes(childRoutes);
    } else {
      if (route.path) {
        paths[route.name] = route.path;
      }
    }
  });
  return paths;
};

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
        config: { routes },
        paths: { cwd },
      } = api;

      const prettierConfig = join(cwd || '.', '.prettierrc.js');
      const paths = getPathsFromRoutes(routes || []);
      const options = merge(getDefaultOptions(), opts);

      const codeString = await prettifyCode(
        outdent`
        ${generateCode(paths, options.variableName)}
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
