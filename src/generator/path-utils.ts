import { compile, PathFunctionOptions } from 'path-to-regexp';
import { StringifiableRecord, stringify } from 'query-string';

type PathMaker<Params, Required extends boolean> = Required extends true
  ? (paramsMap: Params, options?: PathFunctionOptions) => string
  : (paramsMap?: Params, options?: PathFunctionOptions) => string;

export type Params<K extends string, V = string | number> = { [key in K]: V };

export type RepeatParams<K extends string, V = string | number> = Params<K, V[]>;

export enum ParamsType {
  Params = 'Params',
  RepeatParams = 'RepeatParams',
}

function makeMainPathsFrom<Params = void>(path: string) {
  // https://github.com/pillarjs/path-to-regexp#compile-reverse-path-to-regexp
  return compile(path) as PathMaker<Params, Params extends void ? false : true>;
}

export function makePathsFrom<Params, Querys extends StringifiableRecord>(
  path: string,
): (params: Params, querys: Querys) => string;

export function makePathsFrom<Params, Querys extends StringifiableRecord>(path: string) {
  return (params: Params, querys?: Querys) => {
    const search = querys === undefined ? '' : '?' + stringify(querys);
    return makeMainPathsFrom<Params>(path)(params) + search;
  };
}
