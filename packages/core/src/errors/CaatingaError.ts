import { CaatingaErrorCode, type CaatingaErrorCodeValue } from "./CaatingaErrorCode.js";

export { CaatingaErrorCode } from "./CaatingaErrorCode.js";

export class CaatingaError extends Error {
  constructor(
    message: string,
    public readonly code: CaatingaErrorCodeValue,
    public readonly hint?: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "CaatingaError";
  }
}

export function toCaatingaError(error: unknown): CaatingaError {
  if (error instanceof CaatingaError) {
    return error;
  }

  if (error instanceof Error) {
    return new CaatingaError(error.message, CaatingaErrorCode.UNEXPECTED_ERROR, undefined, error);
  }

  return new CaatingaError("An unexpected error occurred.", CaatingaErrorCode.UNEXPECTED_ERROR);
}
