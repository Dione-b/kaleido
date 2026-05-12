import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { KaleidoError } from "../errors/KaleidoError.js";

export async function assertWasmExists(wasmPath: string): Promise<void> {
  try {
    await access(wasmPath);
  } catch {
    throw new KaleidoError(
      `WASM output was not found at ${wasmPath}.`,
      "WASM_NOT_FOUND",
      "Run kaleido build before deploy or generate."
    );
  }
}

export async function hashWasm(wasmPath: string): Promise<string> {
  const bytes = await readFile(wasmPath);
  return createHash("sha256").update(bytes).digest("hex");
}
