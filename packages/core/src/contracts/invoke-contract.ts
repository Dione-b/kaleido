import { readArtifacts } from "../artifacts/read-artifacts.js";
import type { CaatingaConfig } from "../config/config.schema.js";
import { CaatingaError, CaatingaErrorCode } from "../errors/CaatingaError.js";
import { resolveNetwork } from "../networks/resolve-network.js";
import { checkBinary } from "../shell/check-binary.js";
import { runCommand } from "../shell/run-command.js";
import { assertSafeSourceAccount } from "./source-account.js";

export type InvokeTarget = {
  contractName: string;
  method: string;
};

export type InvokeContractOptions = {
  config: CaatingaConfig;
  target: string;
  args?: string[];
  networkName?: string;
  source?: string;
  cwd?: string;
  allowUntestedStellarCli?: boolean;
};

export function parseInvokeTarget(target: string): InvokeTarget {
  const [contractName, method, extra] = target.split(".");

  if (!contractName || !method || extra) {
    throw new CaatingaError(
      `Invalid invoke target "${target}".`,
      CaatingaErrorCode.INVOKE_TARGET_INVALID,
      "Use the format contract.method, for example counter.increment."
    );
  }

  return { contractName, method };
}

export async function invokeContract(options: InvokeContractOptions) {
  const cwd = options.cwd ?? process.cwd();
  const network = resolveNetwork(options.config, options.networkName);
  const target = parseInvokeTarget(options.target);
  const source = assertSafeSourceAccount(options.source);
  const artifacts = await readArtifacts(cwd);
  const contractArtifact = artifacts.networks[network.name]?.contracts[target.contractName];

  if (!contractArtifact) {
    throw new CaatingaError(
      `No deployed artifact found for "${target.contractName}" on "${network.name}".`,
      CaatingaErrorCode.ARTIFACT_NOT_FOUND,
      "Run caatinga deploy for this contract and network before invoking it."
    );
  }

  await checkBinary("stellar", "Install Stellar CLI before running caatinga invoke.", {
    allowUntestedStellarCli: options.allowUntestedStellarCli
  });

  const result = await runCommand("stellar", [
    "contract",
    "invoke",
    "--id",
    contractArtifact.contractId,
    "--source-account",
    source,
    "--rpc-url",
    network.config.rpcUrl,
    "--network-passphrase",
    network.config.networkPassphrase,
    "--",
    target.method,
    ...(options.args ?? [])
  ], {
    cwd,
    allowUntestedStellarCli: options.allowUntestedStellarCli,
    failureCode: CaatingaErrorCode.INVOKE_FAILED
  });

  return {
    target,
    network,
    result: result.stdout || result.all
  };
}
