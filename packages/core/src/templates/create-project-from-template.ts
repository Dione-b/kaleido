import { cp, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { KaleidoError, KaleidoErrorCode } from "../errors/KaleidoError.js";
import { createInitialArtifacts, writeArtifacts } from "../artifacts/write-artifacts.js";
import {
  CURRENT_TEMPLATE_VERSION,
  TemplateManifestSchema,
  isCoreVersionCompatible,
  type TemplateManifest
} from "./template-manifest.schema.js";

export type CreateProjectFromTemplateOptions = {
  projectName: string;
  targetDir: string;
  templateDir: string;
};

export async function createProjectFromTemplate(options: CreateProjectFromTemplateOptions) {
  const targetDir = path.resolve(options.targetDir);
  const templateDir = path.resolve(options.templateDir);

  try {
    await stat(templateDir);
  } catch {
    throw new KaleidoError(
      `Template directory was not found: ${templateDir}`,
      KaleidoErrorCode.TEMPLATE_NOT_FOUND,
      "Use a bundled Kaleido template or set KALEIDO_TEMPLATES_DIR for local development."
    );
  }

  const manifest = await readTemplateManifest(templateDir);

  await mkdir(targetDir, { recursive: true });
  await cp(templateDir, targetDir, {
    recursive: true,
    force: false,
    errorOnExist: true
  });

  await replaceTemplateVariables(targetDir, options.projectName);
  await writeArtifacts(createInitialArtifacts(options.projectName), targetDir);

  return { targetDir, template: manifest };
}

async function readTemplateManifest(templateDir: string): Promise<TemplateManifest> {
  const manifestPath = path.join(templateDir, "kaleido.template.json");

  try {
    const rawManifest = await readFile(manifestPath, "utf8");
    const manifest = TemplateManifestSchema.parse(JSON.parse(rawManifest));

    if (manifest.kaleido.templateVersion !== CURRENT_TEMPLATE_VERSION) {
      throw new KaleidoError(
        "Template is not compatible with this Kaleido version.",
        KaleidoErrorCode.TEMPLATE_INCOMPATIBLE,
        "Use a compatible template version or upgrade Kaleido."
      );
    }

    if (!isCoreVersionCompatible(manifest.kaleido.compatibleCore)) {
      throw new KaleidoError(
        "Template is not compatible with this Kaleido version.",
        KaleidoErrorCode.TEMPLATE_INCOMPATIBLE,
        "Use a compatible template version or upgrade Kaleido."
      );
    }

    return manifest;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new KaleidoError(
        "Template manifest was not found.",
        KaleidoErrorCode.TEMPLATE_MANIFEST_NOT_FOUND,
        "Add a kaleido.template.json file to the template root."
      );
    }

    if (error instanceof KaleidoError) {
      throw error;
    }

    if (error instanceof SyntaxError || error instanceof z.ZodError) {
      throw new KaleidoError(
        "Template is not compatible with this Kaleido version.",
        KaleidoErrorCode.TEMPLATE_INCOMPATIBLE,
        "Use a compatible template version or upgrade Kaleido."
      );
    }

    throw error;
  }
}

async function replaceTemplateVariables(dir: string, projectName: string): Promise<void> {
  const entries = await readdir(dir);

  await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(dir, entry);
    const entryStat = await stat(entryPath);

    if (entryStat.isDirectory()) {
      await replaceTemplateVariables(entryPath, projectName);
      return;
    }

    if (!isTextTemplateFile(entryPath)) {
      return;
    }

    const content = await readFile(entryPath, "utf8");
    await writeFile(entryPath, content.replaceAll("__PROJECT_NAME__", projectName), "utf8");
  }));
}

function isTextTemplateFile(filePath: string): boolean {
  return [
    ".json",
    ".md",
    ".rs",
    ".toml",
    ".ts",
    ".tsx",
    ".css",
    ".html"
  ].includes(path.extname(filePath));
}
