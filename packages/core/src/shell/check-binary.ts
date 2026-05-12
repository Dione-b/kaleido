import { KaleidoError } from "../errors/KaleidoError.js";
import { runCommand } from "./run-command.js";

export async function checkBinary(binary: string, hint: string): Promise<void> {
  try {
    await runCommand(binary, ["--version"]);
  } catch {
    throw new KaleidoError(`${binary} was not found.`, `${binary.toUpperCase()}_NOT_FOUND`, hint);
  }
}
