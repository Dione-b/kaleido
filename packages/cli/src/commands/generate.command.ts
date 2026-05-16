import { Command } from "commander";
import { generateBindings, loadConfig } from "@kaleido-xlm/core";
import { runCliAction } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export function registerGenerateCommand(program: Command): void {
  program
    .command("generate")
    .description("Generate TypeScript bindings for a deployed contract")
    .argument("<contract>", "Contract name")
    .option("-n, --network <network>", "Configured network name")
    .option("--allow-untested-stellar-cli", "Allow local use of a Stellar CLI version newer than Kaleido's tested maximum")
    .action((contractName: string, options: {
      network?: string;
      allowUntestedStellarCli?: boolean;
    }) => runCliAction(async () => {
      const config = await loadConfig();
      const result = await generateBindings({
        config,
        contractName,
        networkName: options.network,
        allowUntestedStellarCli: options.allowUntestedStellarCli === true
      });

      logger.success("Client generated");
      logger.info("");
      logger.info(`Contract: ${result.contractName}`);
      logger.info(`Network: ${result.network.name}`);
      logger.info(`Output: ${result.outputDir}`);
    }));
}
