import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { createProgram } from "./program.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("createProgram", () => {
  let tmpDir: string | undefined;

  afterEach(async () => {
    if (tmpDir) {
      await rm(tmpDir, { recursive: true, force: true });
      tmpDir = undefined;
    }

    delete process.env.KALEIDO_TEMPLATES_DIR;
  });

  it("registers the MVP commands", () => {
    const commandNames = createProgram().commands.map((command) => command.name());

    expect(commandNames).toEqual(
      expect.arrayContaining(["init", "dev", "build", "deploy", "generate", "invoke"])
    );
  });

  it("reports the package version", async () => {
    const packageJson = JSON.parse(
      await readFile(path.resolve(__dirname, "../package.json"), "utf8")
    ) as { version: string };

    expect(createProgram().version()).toBe(packageJson.version);
  });

  it("uses the target directory basename as project name when init receives an absolute path", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "kaleido-cli-init-"));
    process.env.KALEIDO_TEMPLATES_DIR = path.resolve(__dirname, "../../templates");
    const targetDir = path.join(tmpDir, "absolute-path-app");

    await createProgram()
      .exitOverride()
      .parseAsync(["node", "kaleido", "init", targetDir]);

    const packageJson = JSON.parse(
      await readFile(path.join(targetDir, "package.json"), "utf8")
    ) as { name: string };
    const artifacts = JSON.parse(
      await readFile(path.join(targetDir, "kaleido.artifacts.json"), "utf8")
    ) as { project: string };

    expect(packageJson.name).toBe("absolute-path-app");
    expect(artifacts.project).toBe("absolute-path-app");
  });
});
