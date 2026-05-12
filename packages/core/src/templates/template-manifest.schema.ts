import { z } from "zod";
import semver from "semver";

export const CURRENT_TEMPLATE_VERSION = 1;
export const CURRENT_CORE_VERSION = "0.1.0";

export const TemplateManifestSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
  kaleido: z.object({
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
    config: z.string().default("kaleido.config.ts"),
    artifacts: z.string().default("kaleido.artifacts.json")
  })
});

export type TemplateManifest = z.infer<typeof TemplateManifestSchema>;

export function isCoreVersionCompatible(range: string, coreVersion = CURRENT_CORE_VERSION): boolean {
  return semver.satisfies(coreVersion, range);
}
