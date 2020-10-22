export interface YAML {
  paths: Paths;
  options: Options;
}

export interface Paths {
  [key: string]: string | Paths;
}

export interface Route {
  name: string;
  title: string;
  path: string;
  query: string[];
  routes: Route[];
}

export interface Options {
  variableName: VariableName;
}

export interface VariableName {
  staticPath: string;
  pathFactory: string;
  ParamsInterface: string;
  QueryInterface: string;
}
