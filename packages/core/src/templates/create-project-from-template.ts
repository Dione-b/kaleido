import { cp, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { KaleidoError } from "../errors/KaleidoError.js";
import { createInitialArtifacts, writeArtifacts } from "../artifacts/write-artifacts.js";

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
      "TEMPLATE_NOT_FOUND",
      "Use a bundled Kaleido template or set KALEIDO_TEMPLATES_DIR for local development."
    );
  }

  await mkdir(targetDir, { recursive: true });
  await cp(templateDir, targetDir, {
    recursive: true,
    force: false,
    errorOnExist: true
  });

  await replaceTemplateVariables(targetDir, options.projectName);
  await writeArtifacts(createInitialArtifacts(options.projectName), targetDir);

  return { targetDir };
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
