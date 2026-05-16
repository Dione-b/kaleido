import { z } from "zod";
import semver from "semver";
import { CAATINGA_CORE_VERSION } from "../version.js";

export const CURRENT_TEMPLATE_VERSION = 1;

export const TemplateManifestSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
  caatinga: z.object({
    compatibleCore: z.string().min(1),
    templateVersion: z.number().int().positive()
  }),
  frontend: z.object({
    framework: z.enum(["vite-react", "next", "astro"]),
    packageManager: z.enum(["npm", "pnpm", "yarn", "bun"]).default("npm")
  }),
  contracts: z.object({
    path: z.string(),
    default: z.string().optional()
  }),
  files: z.object({
    config: z.string().default("caatinga.config.ts"),
    artifacts: z.string().default("caatinga.artifacts.json")
  })
});

export type TemplateManifest = z.infer<typeof TemplateManifestSchema>;

export function isCoreVersionCompatible(range: string, coreVersion = CAATINGA_CORE_VERSION): boolean {
  return semver.satisfies(coreVersion, range);
}
