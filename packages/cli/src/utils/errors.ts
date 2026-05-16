import { toCaatingaError } from "@caatinga/core";
import { logger } from "./logger.js";

function printError(error: unknown): void {
  const caatingaError = toCaatingaError(error);

  logger.error(`Error: ${caatingaError.message}`);
  logger.info("");
  logger.info(`Code: ${caatingaError.code}`);

  if (caatingaError.hint) {
    logger.info(`Hint: ${caatingaError.hint}`);
  }
}

export async function runCliAction(action: () => Promise<void>): Promise<void> {
  try {
    await action();
  } catch (error) {
    printError(error);
    process.exitCode = 1;
  }
}
