import { KaleidoError, KaleidoErrorCode } from "../errors/KaleidoError.js";

const CONTRACT_ID_REGEX = /\bC[A-Z0-9]{55}\b/;

export function parseContractId(output: string): string {
  const match = output.match(CONTRACT_ID_REGEX);

  if (!match) {
    throw new KaleidoError(
      "Could not find contract ID in Stellar CLI output.",
      KaleidoErrorCode.CONTRACT_ID_NOT_FOUND,
      "Check whether the Stellar CLI output format changed."
    );
  }

  return match[0];
}
