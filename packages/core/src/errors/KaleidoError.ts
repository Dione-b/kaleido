export const KaleidoErrorCode = {
  CONFIG_NOT_FOUND: "KALEIDO_CONFIG_NOT_FOUND",
  INVALID_CONFIG: "KALEIDO_INVALID_CONFIG",
  COMMAND_FAILED: "KALEIDO_COMMAND_FAILED",
  UNEXPECTED_ERROR: "KALEIDO_UNEXPECTED_ERROR",
  STELLAR_CLI_NOT_FOUND: "KALEIDO_STELLAR_CLI_NOT_FOUND",
  RUST_NOT_FOUND: "KALEIDO_RUST_NOT_FOUND",
  RUST_TARGET_NOT_FOUND: "KALEIDO_RUST_TARGET_NOT_FOUND",
  CONTRACT_NOT_FOUND: "KALEIDO_CONTRACT_NOT_FOUND",
  NETWORK_NOT_FOUND: "KALEIDO_NETWORK_NOT_FOUND",
  ARTIFACT_NOT_FOUND: "KALEIDO_ARTIFACT_NOT_FOUND",
  ARTIFACT_INVALID: "KALEIDO_ARTIFACT_INVALID",
  CONTRACT_ID_NOT_FOUND: "KALEIDO_CONTRACT_ID_NOT_FOUND",
  SOURCE_ACCOUNT_REQUIRED: "KALEIDO_SOURCE_ACCOUNT_REQUIRED",
  UNSAFE_SOURCE_ACCOUNT: "KALEIDO_UNSAFE_SOURCE_ACCOUNT",
  BINDINGS_FAILED: "KALEIDO_BINDINGS_FAILED",
  DEPLOY_FAILED: "KALEIDO_DEPLOY_FAILED",
  INVOKE_FAILED: "KALEIDO_INVOKE_FAILED",
  INVOKE_TARGET_INVALID: "KALEIDO_INVOKE_TARGET_INVALID",
  TEMPLATE_NOT_FOUND: "KALEIDO_TEMPLATE_NOT_FOUND",
  TEMPLATE_MANIFEST_NOT_FOUND: "KALEIDO_TEMPLATE_MANIFEST_NOT_FOUND",
  TEMPLATE_INCOMPATIBLE: "KALEIDO_TEMPLATE_INCOMPATIBLE"
} as const;

export type KaleidoErrorCodeValue = typeof KaleidoErrorCode[keyof typeof KaleidoErrorCode];

export class KaleidoError extends Error {
  constructor(
    message: string,
    public readonly code: KaleidoErrorCodeValue,
    public readonly hint?: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "KaleidoError";
  }
}

export function toKaleidoError(error: unknown): KaleidoError {
  if (error instanceof KaleidoError) {
    return error;
  }

  if (error instanceof Error) {
    return new KaleidoError(error.message, KaleidoErrorCode.UNEXPECTED_ERROR, undefined, error);
  }

  return new KaleidoError("An unexpected error occurred.", KaleidoErrorCode.UNEXPECTED_ERROR);
}
