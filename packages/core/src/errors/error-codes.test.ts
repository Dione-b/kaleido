import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { KaleidoErrorCode } from "./KaleidoError.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const coreSrcDir = path.resolve(__dirname, "..");

const PUBLIC_ERROR_CODE_PATTERN = /new KaleidoError\([\s\S]*?,\s*"([A-Z][A-Z0-9_]+)"/g;

describe("KaleidoErrorCode", () => {
  it("should_expose_only_namespaced_public_error_codes", () => {
    expect(Object.values(KaleidoErrorCode).every((code) => code.startsWith("KALEIDO_"))).toBe(true);
  });

  it("should_not_construct_public_errors_with_inline_unprefixed_codes", async () => {
    const files = [
      "artifacts/read-artifacts.ts",
      "config/load-config.ts",
      "contracts/generate-bindings.ts",
      "contracts/invoke-contract.ts",
      "contracts/resolve-contract.ts",
      "contracts/source-account.ts",
      "contracts/wasm.ts",
      "networks/resolve-network.ts",
      "shell/check-binary.ts",
      "shell/run-command.ts",
      "stellar-cli/parse-contract-id.ts",
      "templates/create-project-from-template.ts"
    ];

    const violations: string[] = [];

    for (const file of files) {
      const content = await readFile(path.join(coreSrcDir, file), "utf8");
      for (const match of content.matchAll(PUBLIC_ERROR_CODE_PATTERN)) {
        if (!match[1].startsWith("KALEIDO_")) {
          violations.push(`${file}: ${match[1]}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
