import type { KaleidoConfig } from "../config/config.schema.js";
import { KaleidoError, KaleidoErrorCode } from "../errors/KaleidoError.js";
import { checkBinary } from "../shell/check-binary.js";
import { runCommand } from "../shell/run-command.js";
import { resolveContract } from "./resolve-contract.js";
import { assertWasmExists } from "./wasm.js";

export type BuildContractOptions = {
  config: KaleidoConfig;
  contractName: string;
  cwd?: string;
  allowUntestedStellarCli?: boolean;
};

const RUST_WASM_TARGET = "wasm32-unknown-unknown";

const MISSING_WASM_TARGET_HINT_SUBSTRINGS = [
  "not installed",
  "not found",
  "needs to be installed",
  "add the",
  "rustup target"
] as const;

function isMissingRustWasmTargetError(error: unknown): boolean {
  if (!(error instanceof KaleidoError)) {
    return false;
  }

  const parts = [
    error.message,
    error.hint ?? "",
    error.cause === undefined ? "" : String(error.cause)
  ];
  const haystack = parts.join("\n").toLowerCase();

  if (!haystack.includes(RUST_WASM_TARGET)) {
    return false;
  }

  return MISSING_WASM_TARGET_HINT_SUBSTRINGS.some(needle => haystack.includes(needle));
}

export async function buildContract(options: BuildContractOptions) {
  const cwd = options.cwd ?? process.cwd();
  const contract = resolveContract(options.config, options.contractName, cwd);

  await checkBinary("rustc", "Install Rust before running kaleido build.");
  await checkBinary("stellar", "Install Stellar CLI before running kaleido build.", {
    allowUntestedStellarCli: options.allowUntestedStellarCli
  });

  let result;
  try {
    result = await runCommand("stellar", ["contract", "build"], {
      cwd: contract.sourcePath,
      allowUntestedStellarCli: options.allowUntestedStellarCli,
      failureCode: KaleidoErrorCode.BUILD_FAILED
    });
  } catch (error) {
    if (
      error instanceof KaleidoError &&
      error.code === KaleidoErrorCode.BUILD_FAILED &&
      isMissingRustWasmTargetError(error)
    ) {
      throw new KaleidoError(
        `Required Rust wasm target "${RUST_WASM_TARGET}" is missing.`,
        KaleidoErrorCode.RUST_TARGET_NOT_FOUND,
        `Run \`rustup target add ${RUST_WASM_TARGET}\` and retry the build.`,
        error
      );
    }
    throw error;
  }

  await assertWasmExists(contract.wasmPath);

  return {
    contract,
    output: result.all || result.stdout
  };
}
