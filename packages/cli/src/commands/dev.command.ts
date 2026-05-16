import { Command } from "commander";
import { runCliAction } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export function registerDevCommand(program: Command): void {
  program
    .command("dev")
    .description("Run the local Kaleido development workflow")
    .action(() => runCliAction(async () => {
      logger.warn("kaleido dev is not implemented in the MVP.");
      logger.info("Use kaleido build, deploy, generate, and invoke directly.");
    }));
}


