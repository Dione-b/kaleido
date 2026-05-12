import { execa, type Options } from "execa";
import { KaleidoError, KaleidoErrorCode } from "../errors/KaleidoError.js";

export type RunCommandResult = {
  stdout: string;
  stderr: string;
  all: string;
};

export async function runCommand(
  command: string,
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}
): Promise<RunCommandResult> {
  try {
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
    const output = typeof error === "object" && error && "all" in error ? String(error.all) : undefined;
    throw new KaleidoError(
      `Command failed: ${command} ${args.join(" ")}`,
      KaleidoErrorCode.COMMAND_FAILED,
      output || "Re-run the command with the underlying tool directly for full diagnostics.",
      error
    );
  }
}
