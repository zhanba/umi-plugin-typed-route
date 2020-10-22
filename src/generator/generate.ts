import { set } from 'lodash';
import outdent from 'outdent';
import pathToRegexp from 'path-to-regexp';
import { Paths, VariableName, IRoute } from './types';
import {
  recursiveForEach,
  convert,
  codeStringify,
  getDefaultOptions,
  mergeTypeString,
  ParamsTypeString,
  getParamsTypeString,
} from './utils';

interface ImportInfo {
  // `true` if below variable is used
  makePathsFrom?: boolean;
  Params?: boolean;
  RepeatParams?: boolean;
}

interface ParseResult {
  staticPath: { [key: string]: object | string };
  pathFactory: { [key: string]: object | string };
  ParamsInterface: { [key: string]: object | string };
  QueryInterface: { [key: string]: object | string };
  importInfo: ImportInfo;
}

// using default variable name to avoid conflict with custom variable name,
// and the custom one is only used for export
const VARIABLE_NAME = getDefaultOptions().variableName;

export function generateCode(routes: IRoute[], variableName: VariableName): string {
  const { staticPath, pathFactory, ParamsInterface, QueryInterface, importInfo } = parse(routes);
  const usedImportKeys = Object.keys(importInfo).filter(
    key => !!importInfo[key as keyof ImportInfo],
  );
  const importString =
    usedImportKeys.length > 0
      ? `import { ${usedImportKeys.join(',')} } from "umi-plugin-typed-route"`
      : '';

  return outdent`
    ${importString}

    interface ${VARIABLE_NAME.ParamsInterface} ${codeStringify(ParamsInterface)}

    interface ${VARIABLE_NAME.QueryInterface} ${codeStringify(QueryInterface)}

    const ${VARIABLE_NAME.staticPath} = ${codeStringify(staticPath)};

    const ${VARIABLE_NAME.pathFactory} = ${codeStringify(pathFactory)};

    export {
      ${VARIABLE_NAME.ParamsInterface} as ${variableName.ParamsInterface},
      ${VARIABLE_NAME.QueryInterface} as ${variableName.QueryInterface},
      ${VARIABLE_NAME.staticPath} as ${variableName.staticPath},
      ${VARIABLE_NAME.pathFactory} as ${variableName.pathFactory},
    }
  `;
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

function parse(routes: IRoute[]): ParseResult {
  const paths = getPathsFromRoutes(routes || []);
  const result: ParseResult = {
    ParamsInterface: {},
    QueryInterface: {},
    staticPath: {},
    pathFactory: {},
    importInfo: {},
  };

  recursiveForEach(paths, (pathString, currentRefPath) => {
    const { path, paramsTypeString } = convert(pathString);

    const mergedParamsType = mergeTypeString(...Object.values(paramsTypeString));
    const mergedQueryType = mergeTypeString(
      ...Object.values(getParamsTypeString(getQueryRef(currentRefPath))),
    );
    const pathRef = getPathRef([VARIABLE_NAME.staticPath, ...currentRefPath]);
    const paramsRef = getParamsRef([VARIABLE_NAME.ParamsInterface, ...currentRefPath]);
    const querysRef = getParamsRef([VARIABLE_NAME.QueryInterface, ...currentRefPath]);

    updateImportInfo(paramsTypeString);
    set(result.ParamsInterface, currentRefPath, mergedParamsType || 'void');
    set(result.QueryInterface, currentRefPath, mergedQueryType || 'void');
    set(result.staticPath, currentRefPath, `'${path}'`);
    set(
      result.pathFactory,
      currentRefPath,
      `makePathsFrom<${paramsRef}, ${querysRef}>(${pathRef})`,
    );
  });

  return result;

  function getPathRef(refPaths: string[]): string {
    return refPaths.reduce((ref, nextPath) => {
      /*
       *  See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_Accessors#Dot_notation
       *  a sequence of alphanumerical characters, also including the underscore ("_") and dollar sign ("$"),
       *  that cannot start with a number
       * */
      const isValidToUseDotNotation = /^[a-zA-Z_$]/.test(nextPath);

      if (isValidToUseDotNotation) {
        return `${ref}.${nextPath}`;
      } else {
        return `${ref}['${nextPath}']`;
      }
    });
  }

  function getParamsRef(refPaths: string[]) {
    return refPaths.reduce((ref, nextPath) => `${ref}['${nextPath}']`);
  }

  function updateImportInfo({
    required,
    requiredRepeat,
    optional,
    optionalRepeat,
  }: ParamsTypeString) {
    const { importInfo } = result;

    importInfo.makePathsFrom = true;

    const isUsedParamsType = !!(required || optional);
    if (isUsedParamsType && !importInfo.Params) {
      importInfo.Params = true;
    }

    const isUsedRepeatParamsType = !!(requiredRepeat || optionalRepeat);
    if (isUsedRepeatParamsType && !importInfo.RepeatParams) {
      importInfo.RepeatParams = true;
    }
  }

  function getQueryRef(refPaths: string[]): pathToRegexp.Key[] {
    const queryRef: pathToRegexp.Key[] = [];
    let currentRoutes = routes;
    refPaths.forEach((name, index) => {
      const currentRoute = currentRoutes.find(route => route.name === name);
      currentRoute !== undefined &&
        currentRoute.query !== undefined &&
        queryRef.push(
          ...currentRoute.query.map(query => ({
            name: query,
            optional: true,
            prefix: '',
            delimiter: '',
            repeat: false,
            pattern: '',
          })),
        );
      currentRoutes = currentRoute?.routes ?? [];
    }, []);
    return queryRef;
  }
}
