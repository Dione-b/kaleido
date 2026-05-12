import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { createProjectFromTemplate } from "./create-project-from-template.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("createProjectFromTemplate", () => {
  let tmpDir: string;

  afterEach(async () => {
    if (tmpDir) {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("should_copy_template_replace_project_placeholder_and_write_artifacts", async () => {
    const templateDir = path.resolve(__dirname, "../../../templates/react-vite-counter");
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "kaleido-init-"));
    const targetDir = path.join(tmpDir, "my-dapp");

    await createProjectFromTemplate({
      projectName: "my-dapp",
      targetDir,
      templateDir
    });

    const configText = await readFile(path.join(targetDir, "kaleido.config.ts"), "utf8");
    expect(configText).toContain('project: "my-dapp"');
    expect(configText).not.toContain("__PROJECT_NAME__");

    const artifactsText = await readFile(path.join(targetDir, "kaleido.artifacts.json"), "utf8");
    const artifacts = JSON.parse(artifactsText) as { project: string; version: number };
    expect(artifacts.project).toBe("my-dapp");
    expect(artifacts.version).toBe(1);
  });
});
