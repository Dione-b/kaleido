import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { CaatingaError, CaatingaErrorCode } from "../errors/CaatingaError.js";

export async function assertWasmExists(wasmPath: string): Promise<void> {
  try {
    await access(wasmPath);
  } catch {
    throw new CaatingaError(
      `WASM output was not found at ${wasmPath}.`,
      CaatingaErrorCode.ARTIFACT_NOT_FOUND,
      "Run caatinga build before deploy or generate."
    );
  }
}

export async function hashWasm(wasmPath: string): Promise<string> {
  const bytes = await readFile(wasmPath);
  return createHash("sha256").update(bytes).digest("hex");
}
