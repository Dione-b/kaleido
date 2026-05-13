import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { KaleidoErrorCode } from "./KaleidoError.js";
import { listRepoSourceFiles } from "./list-repo-source-files.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../../..");

const INLINE_UNPREFIXED_ERROR_CODE_PATTERN =
  /new\s+KaleidoError\s*\([\s\S]*?,\s*["']([A-Z][A-Z0-9_]+)["']/g;

describe("KaleidoErrorCode", () => {
  it("should_expose_only_namespaced_public_error_codes", () => {
    expect(Object.values(KaleidoErrorCode).every((code) => code.startsWith("KALEIDO_"))).toBe(true);
  });

  it("should_document_every_public_error_code", async () => {
    const docsPath = path.join(repoRoot, "docs/errors.md");
    const docs = await readFile(docsPath, "utf8");
    const missingCodes = Object.values(KaleidoErrorCode).filter((code) => !docs.includes(`\`${code}\``));

    expect(missingCodes).toEqual([]);
  });

  it("should_not_construct_public_errors_with_inline_unprefixed_codes", async () => {
    const violations: string[] = [];

    for (const filePath of listRepoSourceFiles(repoRoot)) {
      const content = await readFile(filePath, "utf8");
      for (const match of content.matchAll(INLINE_UNPREFIXED_ERROR_CODE_PATTERN)) {
        if (!match[1].startsWith("KALEIDO_")) {
          violations.push(`${path.relative(repoRoot, filePath)}: ${match[1]}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
