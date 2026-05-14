import { toKaleidoError } from "@kaleido/core";
import { logger } from "./logger.js";

function printError(error: unknown): void {
  const kaleidoError = toKaleidoError(error);

  logger.error(`Error: ${kaleidoError.message}`);
  logger.info("");
  logger.info(`Code: ${kaleidoError.code}`);

  if (kaleidoError.hint) {
    logger.info(`Hint: ${kaleidoError.hint}`);
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
