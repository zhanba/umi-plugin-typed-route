import * as fs from "fs";
import * as path from "path";
import outdent from "outdent";
import chalk from "chalk";
import { format, resolveConfig } from "prettier";

import { YAML } from "./types";
import { Logger, LoggerStatus } from "./logger";
import { generateCode } from "./generate";

export async function generateTypeScriptFile(
  filePath: string,
  { paths, options }: YAML,
  prettierConfig: string
) {
  const logger = new Logger(filePath);

  const outputDir = path.dirname(filePath);
  const outputName = `${path.basename(filePath, path.extname(filePath))}.ts`;
  const outputPath = path.join(outputDir, outputName);

  logger.log(`Generate ${chalk.underline(outputPath)}`, LoggerStatus.Started);

  const codeString = await prettifyCode(
    outdent`
    /*
     * Please do not modify this file, because it was generated from file ${path.relative(
       outputDir,
       filePath
     )}.
     * Check https://github.com/LeetCode-OpenSource/typed-path-generator for more details.
     * */

    ${generateCode(paths, options.variableName)}
  `,
    prettierConfig
  );
  fs.writeFileSync(outputPath, codeString);

  logger.log(`Generate ${chalk.underline(outputPath)}`, LoggerStatus.Completed);
}

async function prettifyCode(
  codeString: string,
  prettierConfig: string
): Promise<string> {
  if (typeof prettierConfig === "string") {
    try {
      const config = await resolveConfig(prettierConfig);
      return format(codeString, { ...config, parser: "typescript" });
    } catch (e) {
      console.error(e);
    }
  }

  return format(codeString, { parser: "typescript" });
}
