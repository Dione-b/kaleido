import { checkBinary } from "../shell/check-binary.js";
import { runCommand } from "../shell/run-command.js";
import type { KaleidoConfig } from "../config/config.schema.js";
import { resolveContract } from "./resolve-contract.js";
import { assertWasmExists } from "./wasm.js";

export type BuildContractOptions = {
  config: KaleidoConfig;
  contractName: string;
  cwd?: string;
};

export async function buildContract(options: BuildContractOptions) {
  const cwd = options.cwd ?? process.cwd();
  const contract = resolveContract(options.config, options.contractName, cwd);

  await checkBinary("rustc", "Install Rust before running kaleido build.");
  await checkBinary("stellar", "Install Stellar CLI before running kaleido build.");

  const result = await runCommand("stellar", ["contract", "build"], {
    cwd: contract.sourcePath
  });

  await assertWasmExists(contract.wasmPath);

  return {
    contract,
    output: result.all || result.stdout
  };
}
