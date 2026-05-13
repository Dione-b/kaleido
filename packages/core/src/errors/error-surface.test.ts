import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { KaleidoErrorCode } from "./KaleidoError.js";
import { listRepoSourceFiles } from "./list-repo-source-files.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../../..");
const docsPath = path.join(repoRoot, "docs/errors.md");
const rawPublicErrorPattern = /new\s+KaleidoError\s*\([\s\S]*?,\s*["']KALEIDO_[A-Z0-9_]+["']/g;
const legacyUnprefixedStringCodePattern =
  /new\s+KaleidoError\s*\([\s\S]*?,\s*["']([A-Z][A-Z0-9_]+)["']/g;
const documentedPublicErrorPattern = /^\|\s*`(KALEIDO_[A-Z0-9_]+)`\s*\|/gm;
const requiredV1Codes = [
  "KALEIDO_DEPLOY_FAILED",
  "KALEIDO_BUILD_FAILED",
  "KALEIDO_BINDINGS_FAILED",
  "KALEIDO_INVOKE_FAILED",
  "KALEIDO_TEMPLATE_INVALID",
  "KALEIDO_CONTRACT_DEPENDENCY_NOT_FOUND",
  "KALEIDO_CONTRACT_DEPENDENCY_CYCLE",
  "KALEIDO_CONTRACT_DEPENDENCY_ARTIFACT_NOT_FOUND",
  "KALEIDO_DEPLOY_ARG_PLACEHOLDER_INVALID",
  "KALEIDO_DEPLOY_ARG_PLACEHOLDER_UNRESOLVED"
];

describe("public error surface", () => {
  it("exports only KALEIDO_* codes", () => {
    expect(Object.values(KaleidoErrorCode).filter((code) => !code.startsWith("KALEIDO_"))).toEqual([]);
  });

  it("exports every v1-required public error code", () => {
    const exportedCodes = new Set<string>(Object.values(KaleidoErrorCode));
    const missingCodes = requiredV1Codes.filter((code) => !exportedCodes.has(code));

    expect(missingCodes).toEqual([]);
  });

  it("documents every exported public error code", () => {
    const docs = readFileSync(docsPath, "utf8");
    const missingCodes = Object.values(KaleidoErrorCode).filter((code) => !docs.includes(`\`${code}\``));

    expect(missingCodes).toEqual([]);
  });

  it("exports every documented public error code", () => {
    const docs = readFileSync(docsPath, "utf8");
    const documentedCodes = [...docs.matchAll(documentedPublicErrorPattern)].map((match) => match[1]);
    const exportedCodes = new Set<string>(Object.values(KaleidoErrorCode));
    const extraCodes = documentedCodes.filter((code) => !exportedCodes.has(code));

    expect(extraCodes).toEqual([]);
  });

  it("does not construct KaleidoError with raw KALEIDO_* string codes", () => {
    const violations = listRepoSourceFiles(repoRoot).flatMap((filePath) => {
      const source = readFileSync(filePath, "utf8");
      const matches = source.match(rawPublicErrorPattern) ?? [];

      return matches.map((match) => `${path.relative(repoRoot, filePath)}: ${match}`);
    });

    expect(violations).toEqual([]);
  });

  it("does not construct KaleidoError with legacy unprefixed string codes", () => {
    const violations = listRepoSourceFiles(repoRoot).flatMap((filePath) => {
      const source = readFileSync(filePath, "utf8");
      const matches = [...source.matchAll(legacyUnprefixedStringCodePattern)]
        .map((m) => m[1])
        .filter((code) => /^[A-Z][A-Z0-9_]+$/.test(code) && !code.startsWith("KALEIDO_"));

      return matches.map((code) => `${path.relative(repoRoot, filePath)}: ${code}`);
    });

    expect(violations).toEqual([]);
  });
});
