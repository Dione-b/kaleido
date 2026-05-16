import { Command } from "commander";
import { buildContract, loadConfig } from "@caatinga/core";
import { runCliAction } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export function registerBuildCommand(program: Command): void {
  program
    .command("build")
    .description("Build a configured Soroban contract")
    .argument("[contract]", "Contract name", "counter")
    .option("--allow-untested-stellar-cli", "Allow local use of a Stellar CLI version newer than Caatinga's tested maximum")
    .action((contractName: string, options: { allowUntestedStellarCli?: boolean }) => runCliAction(async () => {
      const config = await loadConfig();
      const result = await buildContract({
        config,
        contractName,
        allowUntestedStellarCli: options.allowUntestedStellarCli === true
      });

      logger.success("Contract built");
      logger.info("");
      logger.info(`Contract: ${result.contract.name}`);
      logger.info(`WASM: ${result.contract.config.wasm}`);
    }));
}
