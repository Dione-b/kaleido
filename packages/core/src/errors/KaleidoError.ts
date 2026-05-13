import { KaleidoErrorCode, type KaleidoErrorCodeValue } from "./KaleidoErrorCode.js";

export { KaleidoErrorCode, type KaleidoErrorCodeValue } from "./KaleidoErrorCode.js";

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
