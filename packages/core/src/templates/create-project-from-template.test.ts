import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { KaleidoErrorCode } from "../errors/KaleidoError.js";
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

    const result = await createProjectFromTemplate({
      projectName: "my-dapp",
      targetDir,
      templateDir
    });

    expect(result.template.name).toBe("react-vite-counter");
    expect(result.template.version).toBe("0.1.0");

    const configText = await readFile(path.join(targetDir, "kaleido.config.ts"), "utf8");
    expect(configText).toContain('project: "my-dapp"');
    expect(configText).not.toContain("__PROJECT_NAME__");

    const artifactsText = await readFile(path.join(targetDir, "kaleido.artifacts.json"), "utf8");
    const artifacts = JSON.parse(artifactsText) as { project: string; version: number };
    expect(artifacts.project).toBe("my-dapp");
    expect(artifacts.version).toBe(1);
  });

  it("should_fail_when_template_manifest_is_missing", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "kaleido-init-"));
    const templateDir = path.join(tmpDir, "template");
    await mkdir(templateDir);

    await expect(createProjectFromTemplate({
      projectName: "my-dapp",
      targetDir: path.join(tmpDir, "my-dapp"),
      templateDir
    })).rejects.toMatchObject({
      code: KaleidoErrorCode.TEMPLATE_MANIFEST_NOT_FOUND
    });
  });

  it("should_fail_when_template_requires_incompatible_core", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "kaleido-init-"));
    const templateDir = path.join(tmpDir, "template");
    await mkdir(templateDir);
    await writeFile(path.join(templateDir, "kaleido.template.json"), JSON.stringify({
      name: "future-template",
      version: "1.0.0",
      kaleido: {
        compatibleCore: "^99.0.0",
        templateVersion: 1
      },
      frontend: {
        framework: "vite-react",
        packageManager: "npm"
      },
      contracts: {
        path: "contracts"
      },
      files: {
        config: "kaleido.config.ts",
        artifacts: "kaleido.artifacts.json"
      }
    }), "utf8");

    await expect(createProjectFromTemplate({
      projectName: "my-dapp",
      targetDir: path.join(tmpDir, "my-dapp"),
      templateDir
    })).rejects.toMatchObject({
      code: KaleidoErrorCode.TEMPLATE_INCOMPATIBLE
    });
  });
});
