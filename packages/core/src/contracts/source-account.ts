import { CaatingaError, CaatingaErrorCode } from "../errors/CaatingaError.js";
import { isLikelyPublicKeySource } from "../stellar-cli/recover-deploy-contract-id.js";

export function assertSafeSourceAccount(source: string | undefined): string {
  if (!source) {
    throw new CaatingaError(
      "A source account or Stellar CLI identity is required.",
      CaatingaErrorCode.SOURCE_ACCOUNT_REQUIRED,
      "Pass a Stellar CLI identity alias, for example: --source alice"
    );
  }

  if (source.startsWith("S") || source.trim().includes(" ")) {
    throw new CaatingaError(
      "Refusing to accept a likely secret key or seed phrase as --source.",
      CaatingaErrorCode.UNSAFE_SOURCE_ACCOUNT,
      "Use a Stellar CLI identity alias instead, for example: --source alice"
    );
  }

  if (isLikelyPublicKeySource(source)) {
    throw new CaatingaError(
      `Public account address cannot sign transactions: ${source}`,
      CaatingaErrorCode.UNSAFE_SOURCE_ACCOUNT,
      "Use a Stellar CLI identity with a secret key. Example: stellar keys generate alice --fund --network testnet, then --source alice"
    );
  }

  return source;
}
