import { IApi, IRoute } from "umi-types";
import { generateTypeScriptFile } from "./generator/index";
import { join } from "path";
import { merge } from "lodash";
import { getDefaultOptions } from "./generator/utils";
import { Paths } from "./generator/types";

interface PluginConfig {}

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
  api.beforeDevServer(() => {
    const {
      routes,
      paths: { cwd }
    } = api;
    const outputTsFilePath = join(cwd, "src", "typedRoute.ts");
    const prettierConfigFilePath = join(cwd, "src", ".prettierrc.js");
    const paths = getPathsFromRoutes(routes);
    const options = merge(getDefaultOptions(), opts);
    generateTypeScriptFile(
      outputTsFilePath,
      { paths, options },
      prettierConfigFilePath
    );
  });
};
