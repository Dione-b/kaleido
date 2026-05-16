import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CaatingaError, CaatingaErrorCode } from "@caatinga/core";

export async function resolveTemplateDir(templateName: string): Promise<string> {
  const envTemplatesDir = process.env.CAATINGA_TEMPLATES_DIR;
  const candidates = [
    envTemplatesDir ? path.join(envTemplatesDir, templateName) : undefined,
    path.resolve(process.cwd(), "packages", "templates", templateName),
    ...candidatePathsFromModule(templateName)
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next local development or package layout candidate.
    }
  }

  throw new CaatingaError(
    `Template "${templateName}" was not found.`,
    CaatingaErrorCode.TEMPLATE_NOT_FOUND,
    "Set CAATINGA_TEMPLATES_DIR or run from a Caatinga checkout that includes packages/templates."
  );
}

function candidatePathsFromModule(templateName: string): string[] {
  const currentFile = fileURLToPath(import.meta.url);
  const start = path.dirname(currentFile);
  const candidates: string[] = [];
  let dir = start;

  for (let depth = 0; depth < 8; depth += 1) {
    candidates.push(path.join(dir, "packages", "templates", templateName));
    candidates.push(path.join(dir, "templates", templateName));
    candidates.push(path.join(dir, "node_modules", "@caatinga", "templates", templateName));
    dir = path.dirname(dir);
  }

  return candidates;
}
