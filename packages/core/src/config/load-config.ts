import { access } from "node:fs/promises";
import path from "node:path";
import { createJiti } from "jiti";
import { z } from "zod";
import { KaleidoError, KaleidoErrorCode } from "../errors/KaleidoError.js";
import { KaleidoConfigSchema, type KaleidoConfig } from "./config.schema.js";

export type LoadConfigOptions = {
  cwd?: string;
  configPath?: string;
};

export async function loadConfig(options: LoadConfigOptions = {}): Promise<KaleidoConfig> {
  const cwd = options.cwd ?? process.cwd();
  const configPath = path.resolve(cwd, options.configPath ?? "kaleido.config.ts");

  try {
    await access(configPath);
  } catch {
    throw new KaleidoError(
      "kaleido.config.ts was not found.",
      KaleidoErrorCode.CONFIG_NOT_FOUND,
      "Run this command from a Kaleido project root, or create a kaleido.config.ts file."
    );
  }

  try {
    const jiti = createJiti(import.meta.url);
    const loaded = await jiti.import(configPath, { default: true });
    return KaleidoConfigSchema.parse(loaded);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new KaleidoError(
        "kaleido.config.ts is invalid.",
        KaleidoErrorCode.INVALID_CONFIG,
        error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")
      );
    }

    throw error;
  }
}
