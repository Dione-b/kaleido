import { KaleidoError, KaleidoErrorCode } from "../errors/KaleidoError.js";

export function assertSafeSourceAccount(source: string | undefined): string {
  if (!source) {
    throw new KaleidoError(
      "A source account or Stellar CLI identity is required.",
      KaleidoErrorCode.SOURCE_ACCOUNT_REQUIRED,
      "Pass --source alice or --source G...; do not pass secret keys or seed phrases."
    );
  }

  if (source.startsWith("S") || source.trim().includes(" ")) {
    throw new KaleidoError(
      "Refusing to accept a likely secret key or seed phrase as --source.",
      KaleidoErrorCode.UNSAFE_SOURCE_ACCOUNT,
      "Use a Stellar CLI identity alias or public account address instead."
    );
  }

  return source;
}
