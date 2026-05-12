import { Command } from "commander";
import { deployContract, loadConfig } from "@kaleido/core";
import { runCliAction } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export function registerDeployCommand(program: Command): void {
  program
    .command("deploy")
    .description("Deploy a built Soroban contract")
    .argument("<contract>", "Contract name")
    .option("-n, --network <network>", "Configured network name")
    .requiredOption("-s, --source <source>", "Stellar CLI identity alias or public account address")
    .action((contractName: string, options: { network?: string; source: string }) => runCliAction(async () => {
      const config = await loadConfig();
      const result = await deployContract({
        config,
        contractName,
        networkName: options.network,
        source: options.source
      });

      logger.success("Contract deployed");
      logger.info("");
      logger.info(`Network: ${result.network.name}`);
      logger.info(`Contract: ${result.contract.name}`);
      logger.info(`Contract ID: ${result.contractId}`);
      logger.info("Artifacts updated: kaleido.artifacts.json");
    }));
}
