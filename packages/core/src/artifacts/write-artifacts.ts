import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CaatingaArtifacts } from "./artifact.schema.js";

export async function writeArtifacts(artifacts: CaatingaArtifacts, cwd = process.cwd()): Promise<string> {
  const artifactsPath = path.resolve(cwd, "caatinga.artifacts.json");
  await mkdir(path.dirname(artifactsPath), { recursive: true });
  await writeFile(artifactsPath, `${JSON.stringify(artifacts, null, 2)}\n`, "utf8");
  return artifactsPath;
}

export function createInitialArtifacts(project: string): CaatingaArtifacts {
  return {
    project,
    version: 1,
    networks: {}
  };
}
