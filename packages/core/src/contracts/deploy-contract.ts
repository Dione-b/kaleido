import { readArtifacts } from "../artifacts/read-artifacts.js";
import { updateArtifact } from "../artifacts/update-artifact.js";
import { writeArtifacts } from "../artifacts/write-artifacts.js";
import type { KaleidoConfig } from "../config/config.schema.js";
import { KaleidoError } from "../errors/KaleidoError.js";
import { resolveNetwork } from "../networks/resolve-network.js";
import { checkBinary } from "../shell/check-binary.js";
import { runCommand } from "../shell/run-command.js";
import { assertSafeSourceAccount } from "./source-account.js";
import { resolveContract } from "./resolve-contract.js";
import { assertWasmExists, hashWasm } from "./wasm.js";

export type DeployContractOptions = {
  config: KaleidoConfig;
  contractName: string;
  networkName?: string;
  source?: string;
  cwd?: string;
};

export async function deployContract(options: DeployContractOptions) {
  const cwd = options.cwd ?? process.cwd();
  const contract = resolveContract(options.config, options.contractName, cwd);
  const network = resolveNetwork(options.config, options.networkName);
  const source = assertSafeSourceAccount(options.source);

  await checkBinary("stellar", "Install Stellar CLI before running kaleido deploy.");
  await assertWasmExists(contract.wasmPath);

  const result = await runCommand("stellar", [
    "contract",
    "deploy",
    "--wasm",
    contract.wasmPath,
    "--source-account",
    source,
    "--rpc-url",
    network.config.rpcUrl,
    "--network-passphrase",
    network.config.networkPassphrase
  ], { cwd });

  const contractId = parseContractId(result.stdout || result.all);
  const artifacts = await readArtifacts(cwd);
  const wasmHash = await hashWasm(contract.wasmPath);
  const nextArtifacts = updateArtifact(artifacts, network.name, contract.name, {
    contractId,
    wasmHash,
    deployedAt: new Date().toISOString(),
    sourcePath: contract.config.path,
    wasmPath: contract.config.wasm
  });
  const artifactsPath = await writeArtifacts(nextArtifacts, cwd);

  return {
    contract,
    network,
    contractId,
    artifactsPath,
    output: result.all || result.stdout
  };
}

function parseContractId(output: string): string {
  const match = output.match(/\bC[A-Z0-9]{55,}\b/);

  if (!match) {
    throw new KaleidoError(
      "Stellar CLI did not return a contract ID.",
      "CONTRACT_ID_NOT_FOUND",
      "Check the Stellar CLI output and deployment status before retrying."
    );
  }

  return match[0];
}
