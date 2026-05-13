import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const packages = ["cli", "core", "client"];
const repoRoot = join(__dirname, "../../../..");

describe("publish package manifests", () => {
  for (const packageName of packages) {
    it(`${packageName} has publish-safe exports`, () => {
      const packageJson = JSON.parse(
        readFileSync(join(repoRoot, `packages/${packageName}/package.json`), "utf8")
      );

      expect(packageJson.type).toBe("module");
      expect(packageJson.main).toBe("./dist/index.cjs");
      expect(packageJson.module).toBe("./dist/index.js");
      expect(packageJson.types).toBe("./dist/index.d.ts");
      expect(packageJson.files).toEqual(expect.arrayContaining(["dist", "README.md", "LICENSE"]));
      expect(JSON.stringify(packageJson)).not.toContain("workspace:*");
    });
  }

  it("cli exposes kaleido bin", () => {
    const packageJson = JSON.parse(readFileSync(join(repoRoot, "packages/cli/package.json"), "utf8"));
    expect(packageJson.bin).toEqual({ kaleido: "./dist/index.js" });
  });

  it("client exposes freighter subpath", () => {
    const packageJson = JSON.parse(
      readFileSync(join(repoRoot, "packages/client/package.json"), "utf8")
    );
    expect(packageJson.exports["./freighter"]).toEqual({
      types: "./dist/freighter.d.ts",
      import: "./dist/freighter.js",
      require: "./dist/freighter.cjs"
    });
  });
});
