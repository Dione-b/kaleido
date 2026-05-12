import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { KaleidoError } from "../errors/KaleidoError.js";
import { KaleidoArtifactsSchema, type KaleidoArtifacts } from "./artifact.schema.js";

export async function readArtifacts(cwd = process.cwd()): Promise<KaleidoArtifacts> {
  const artifactsPath = path.resolve(cwd, "kaleido.artifacts.json");

  try {
    const json = await readFile(artifactsPath, "utf8");
    return KaleidoArtifactsSchema.parse(JSON.parse(json));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new KaleidoError(
        "kaleido.artifacts.json was not found.",
        "ARTIFACTS_NOT_FOUND",
        "Run kaleido init, or create the artifacts file before deploying or generating bindings."
      );
    }

    if (error instanceof SyntaxError || error instanceof z.ZodError) {
      throw new KaleidoError(
        "kaleido.artifacts.json is invalid.",
        "ARTIFACTS_INVALID",
        "Fix the JSON shape before running Kaleido commands."
      );
    }

    throw error;
  }
}
