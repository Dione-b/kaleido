import { z } from "zod";

export const ContractArtifactSchema = z.object({
  contractId: z.string().min(1),
  wasmHash: z.string().min(1),
  deployedAt: z.string().datetime(),
  sourcePath: z.string().min(1),
  wasmPath: z.string().min(1)
});

export const NetworkArtifactsSchema = z.object({
  contracts: z.record(z.string().min(1), ContractArtifactSchema).default({})
});

export const KaleidoArtifactsSchema = z.object({
  project: z.string().min(1),
  version: z.literal(1),
  networks: z.record(z.string().min(1), NetworkArtifactsSchema).default({})
});

export type ContractArtifact = z.infer<typeof ContractArtifactSchema>;
export type KaleidoArtifacts = z.infer<typeof KaleidoArtifactsSchema>;
