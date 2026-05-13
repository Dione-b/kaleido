import { mkdir } from "node:fs/promises";
import path from "node:path";
import { readArtifacts } from "../artifacts/read-artifacts.js";
import type { KaleidoConfig } from "../config/config.schema.js";
import { KaleidoError, KaleidoErrorCode } from "../errors/KaleidoError.js";
import { resolveNetwork } from "../networks/resolve-network.js";
import { checkBinary } from "../shell/check-binary.js";
import { runCommand } from "../shell/run-command.js";

export type GenerateBindingsOptions = {
  config: KaleidoConfig;
  contractName: string;
  networkName?: string;
  cwd?: string;
  allowUntestedStellarCli?: boolean;
};

export async function generateBindings(options: GenerateBindingsOptions) {
  const cwd = options.cwd ?? process.cwd();
  const network = resolveNetwork(options.config, options.networkName);
  const artifacts = await readArtifacts(cwd);
  const contractArtifact = artifacts.networks[network.name]?.contracts[options.contractName];

  if (!contractArtifact) {
    throw new KaleidoError(
      `No deployed artifact found for "${options.contractName}" on "${network.name}".`,
      KaleidoErrorCode.ARTIFACT_NOT_FOUND,
      "Run kaleido deploy for this contract and network before generating bindings."
    );
  }

  await checkBinary("stellar", "Install Stellar CLI before running kaleido generate.", {
    allowUntestedStellarCli: options.allowUntestedStellarCli
  });

  const outputDir = path.resolve(cwd, options.config.frontend.bindingsOutput, options.contractName);
  await mkdir(outputDir, { recursive: true });

  const result = await runCommand("stellar", [
    "contract",
    "bindings",
    "typescript",
    "--contract-id",
    contractArtifact.contractId,
    "--output-dir",
    outputDir,
    "--overwrite",
    "--rpc-url",
    network.config.rpcUrl,
    "--network-passphrase",
    network.config.networkPassphrase
  ], {
    cwd,
    allowUntestedStellarCli: options.allowUntestedStellarCli,
    failureCode: KaleidoErrorCode.BINDINGS_FAILED
  });

  return {
    contractName: options.contractName,
    network,
    outputDir,
    output: result.all || result.stdout
  };
}
