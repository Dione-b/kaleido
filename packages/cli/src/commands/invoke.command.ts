import { Command } from "commander";
import { invokeContract, loadConfig } from "@caatinga/core";
import { runCliAction } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export function registerInvokeCommand(program: Command): void {
  program
    .command("invoke")
    .description("Invoke a deployed contract function")
    .argument("<target>", "Invoke target in contract.method format")
    .argument("[args...]", "Arguments forwarded to Stellar CLI after the method name")
    .option("-n, --network <network>", "Configured network name")
    .requiredOption("-s, --source <source>", "Stellar CLI identity alias or public account address")
    .option("--allow-untested-stellar-cli", "Allow local use of a Stellar CLI version newer than Caatinga's tested maximum")
    .allowUnknownOption(true)
    .allowExcessArguments(true)
    .action((target: string, args: string[], options: {
      network?: string;
      source: string;
      allowUntestedStellarCli?: boolean;
    }) => runCliAction(async () => {
      const config = await loadConfig();
      const result = await invokeContract({
        config,
        target,
        args,
        networkName: options.network,
        source: options.source,
        allowUntestedStellarCli: options.allowUntestedStellarCli === true
      });

      logger.success("Invoke complete");
      logger.info("");
      logger.info(`Network: ${result.network.name}`);
      logger.info(`Contract: ${result.target.contractName}`);
      logger.info(`Method: ${result.target.method}`);

      if (result.result) {
        logger.info("");
        logger.info(result.result);
      }
    }));
}
