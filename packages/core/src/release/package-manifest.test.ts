import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const packages = ["core", "client"];
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
    expect(packageJson.main).toBe("./dist/index.js");
    expect(packageJson.module).toBe("./dist/index.js");
    expect(packageJson.types).toBe("./dist/index.d.ts");
    expect(packageJson.exports).toEqual({
      ".": {
        types: "./dist/index.d.ts",
        import: "./dist/index.js"
      }
    });
    expect(packageJson.scripts.build).toBe("tsup src/index.ts --format esm --dts --clean");
    expect(JSON.stringify(packageJson)).not.toContain("workspace:*");
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

  it("publish dry-run uses the pre-v1 next dist-tag", () => {
    const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
    expect(packageJson.scripts["publish:dry-run"]).toContain("--tag next");
  });
});
