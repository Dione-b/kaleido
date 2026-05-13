import type { KaleidoArtifacts } from "../artifacts/artifact.schema.js";
import { KaleidoError, KaleidoErrorCode } from "../errors/KaleidoError.js";

const CONTRACT_ID_PLACEHOLDER = /^\$\{contracts\.([A-Za-z0-9_-]+)\.contractId\}$/;

export type DeployArgValue = string | number | boolean;

export function resolveDeployArgs(input: {
  deployArgs: Record<string, DeployArgValue>;
  artifacts: KaleidoArtifacts;
  network: string;
}): Record<string, DeployArgValue> {
  const resolved: Record<string, DeployArgValue> = {};

  for (const [key, value] of Object.entries(input.deployArgs)) {
    if (typeof value !== "string" || !value.includes("${")) {
      resolved[key] = value;
      continue;
    }

    const match = value.match(CONTRACT_ID_PLACEHOLDER);
    if (!match) {
      throw new KaleidoError(
        `Deploy arg "${key}" contains an unsupported placeholder.`,
        KaleidoErrorCode.DEPLOY_ARG_PLACEHOLDER_INVALID,
        "Use only ${contracts.<contractName>.contractId}."
      );
    }

    const contractName = match[1];
    const contractArtifact = input.artifacts.networks[input.network]?.contracts[contractName];

    if (!contractArtifact?.contractId) {
      throw new KaleidoError(
        `No dependency artifact found for "${contractName}" on "${input.network}".`,
        KaleidoErrorCode.CONTRACT_DEPENDENCY_ARTIFACT_NOT_FOUND,
        "Deploy the dependency first or run deploy without --no-deps."
      );
    }

    resolved[key] = contractArtifact.contractId;
  }

  return resolved;
}
