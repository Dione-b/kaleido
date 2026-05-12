import path from "node:path";
import { KaleidoError, KaleidoErrorCode } from "../errors/KaleidoError.js";
import type { ContractConfig, KaleidoConfig } from "../config/config.schema.js";

export type ResolvedContract = {
  name: string;
  config: ContractConfig;
  sourcePath: string;
  wasmPath: string;
};

export function resolveContract(
  config: KaleidoConfig,
  contractName: string,
  cwd = process.cwd()
): ResolvedContract {
  const contract = config.contracts[contractName];

  if (!contract) {
    throw new KaleidoError(
      `Contract "${contractName}" is not configured.`,
      KaleidoErrorCode.CONTRACT_NOT_FOUND,
      `Add "${contractName}" to kaleido.config.ts contracts, or pass a configured contract name.`
    );
  }

  return {
    name: contractName,
    config: contract,
    sourcePath: path.resolve(cwd, contract.path),
    wasmPath: path.resolve(cwd, contract.wasm)
  };
}
