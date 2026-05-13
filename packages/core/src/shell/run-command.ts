import { execa, type Options } from "execa";
import { KaleidoError, KaleidoErrorCode } from "../errors/KaleidoError.js";
import { checkStellarCliVersion } from "../stellar-cli/check-stellar-cli-version.js";

export type RunCommandResult = {
  stdout: string;
  stderr: string;
  all: string;
};

export type RunCommandOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  allowUntestedStellarCli?: boolean;
  skipStellarVersionCheck?: boolean;
};

export async function runCommand(
  command: string,
  args: string[],
  options: RunCommandOptions = {}
): Promise<RunCommandResult> {
  try {
    if (command === "stellar" && !options.skipStellarVersionCheck) {
      await checkStellarCliVersion({
        allowUntested: options.allowUntestedStellarCli === true
      });
    }

    const result = await execa(command, args, {
      cwd: options.cwd,
      env: options.env,
      all: true,
      reject: true
    } satisfies Options);

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      all: result.all ?? ""
    };
  } catch (error) {
    if (error instanceof KaleidoError) {
      throw error;
    }

    if (
      command === "stellar" &&
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      throw new KaleidoError(
        "Stellar CLI was not found.",
        KaleidoErrorCode.STELLAR_CLI_NOT_FOUND,
        "Install Stellar CLI before running Kaleido Stellar-backed commands.",
        error
      );
    }

    const output = typeof error === "object" && error && "all" in error ? String(error.all) : undefined;
    throw new KaleidoError(
      `Command failed: ${command} ${args.join(" ")}`,
      KaleidoErrorCode.COMMAND_FAILED,
      output || "Re-run the command with the underlying tool directly for full diagnostics.",
      error
    );
  }
}
