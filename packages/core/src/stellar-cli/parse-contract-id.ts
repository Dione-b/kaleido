import { CaatingaError, CaatingaErrorCode } from "../errors/CaatingaError.js";

const CONTRACT_ID_REGEX = /\bC[A-Z0-9]{55}\b/;

export function parseContractId(output: string): string {
  const match = output.match(CONTRACT_ID_REGEX);

  if (!match) {
    throw new CaatingaError(
      "Could not find contract ID in Stellar CLI output.",
      CaatingaErrorCode.CONTRACT_ID_NOT_FOUND,
      "Check whether the Stellar CLI output format changed."
    );
  }

  return match[0];
}
