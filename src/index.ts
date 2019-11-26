import { IApi } from "umi-types";

interface PluginConfig {}

export default (api: IApi, opts: PluginConfig) => {
  api.beforeDevServer(() => {
    const { routes } = api;
  });
};
