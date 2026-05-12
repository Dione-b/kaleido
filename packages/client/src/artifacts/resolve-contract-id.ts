import { KaleidoError, KaleidoErrorCode, type KaleidoArtifacts } from "@kaleido/core";

export function resolveContractId(input: {
  artifacts: KaleidoArtifacts;
  network: string;
  contract: string;
  explicitContractId?: string;
}): string {
  if (input.explicitContractId) {
    return input.explicitContractId;
  }

  const contractId =
    input.artifacts.networks[input.network]?.contracts[input.contract]?.contractId;

  if (contractId) {
    return contractId;
  }

  throw new KaleidoError(
    `No contract artifact found for "${input.contract}" on "${input.network}".`,
    KaleidoErrorCode.CONTRACT_ARTIFACT_NOT_FOUND,
    "Deploy the contract first or pass contractId explicitly."
  );
}
