import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { CaatingaError, CaatingaErrorCode } from "../errors/CaatingaError.js";
import { CaatingaArtifactsSchema, type CaatingaArtifacts } from "./artifact.schema.js";

export async function readArtifacts(cwd = process.cwd()): Promise<CaatingaArtifacts> {
  const artifactsPath = path.resolve(cwd, "caatinga.artifacts.json");

  try {
    const json = await readFile(artifactsPath, "utf8");
    return CaatingaArtifactsSchema.parse(JSON.parse(json));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new CaatingaError(
        "caatinga.artifacts.json was not found.",
        CaatingaErrorCode.ARTIFACT_NOT_FOUND,
        "Run caatinga init, or create the artifacts file before deploying or generating bindings."
      );
    }

    if (error instanceof SyntaxError || error instanceof z.ZodError) {
      throw new CaatingaError(
        "caatinga.artifacts.json is invalid.",
        CaatingaErrorCode.ARTIFACT_INVALID,
        "Fix the JSON shape before running Caatinga commands."
      );
    }

    throw error;
  }
}
