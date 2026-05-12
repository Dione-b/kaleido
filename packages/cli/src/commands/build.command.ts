import { Command } from "commander";
import { buildContract, loadConfig } from "@kaleido/core";
import { runCliAction } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export function registerBuildCommand(program: Command): void {
  program
    .command("build")
    .description("Build a configured Soroban contract")
    .argument("[contract]", "Contract name", "counter")
    .action((contractName: string) => runCliAction(async () => {
      const config = await loadConfig();
      const result = await buildContract({ config, contractName });

      logger.success("Contract built");
      logger.info("");
      logger.info(`Contract: ${result.contract.name}`);
      logger.info(`WASM: ${result.contract.config.wasm}`);
    }));
}
