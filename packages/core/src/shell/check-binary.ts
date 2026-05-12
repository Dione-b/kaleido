import { KaleidoError, KaleidoErrorCode } from "../errors/KaleidoError.js";
import { runCommand } from "./run-command.js";

export async function checkBinary(binary: string, hint: string): Promise<void> {
  try {
    await runCommand(binary, ["--version"]);
  } catch {
    const code = binary === "stellar"
      ? KaleidoErrorCode.STELLAR_CLI_NOT_FOUND
      : binary === "rustc"
        ? KaleidoErrorCode.RUST_NOT_FOUND
        : KaleidoErrorCode.COMMAND_FAILED;
    throw new KaleidoError(`${binary} was not found.`, code, hint);
  }
}
