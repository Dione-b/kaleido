import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { KaleidoArtifacts } from "./artifact.schema.js";

export async function writeArtifacts(artifacts: KaleidoArtifacts, cwd = process.cwd()): Promise<string> {
  const artifactsPath = path.resolve(cwd, "kaleido.artifacts.json");
  await mkdir(path.dirname(artifactsPath), { recursive: true });
  await writeFile(artifactsPath, `${JSON.stringify(artifacts, null, 2)}\n`, "utf8");
  return artifactsPath;
}

export function createInitialArtifacts(project: string): KaleidoArtifacts {
  return {
    project,
    version: 1,
    networks: {}
  };
}
