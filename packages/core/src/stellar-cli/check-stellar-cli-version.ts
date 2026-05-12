import { KaleidoError, KaleidoErrorCode } from "../errors/KaleidoError.js";
import { runCommand } from "../shell/run-command.js";
import { assertSupportedStellarCliVersion, parseStellarCliVersion } from "./version.js";

export type CheckStellarCliVersionOptions = {
  allowUntested: boolean;
};

export async function checkStellarCliVersion(
  input: CheckStellarCliVersionOptions
): Promise<string> {
  try {
    const result = await runCommand("stellar", ["--version"], {
      skipStellarVersionCheck: true
    });
    const output = result.all || result.stdout || result.stderr;

    return assertSupportedStellarCliVersion({
      version: parseStellarCliVersion(output),
      allowUntested: input.allowUntested
    });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "ENOENT") {
      throw new KaleidoError(
        "Stellar CLI was not found.",
        KaleidoErrorCode.STELLAR_CLI_NOT_FOUND,
        "Install Stellar CLI before running Kaleido Stellar-backed commands.",
        error
      );
    }

    throw error;
  }
}
