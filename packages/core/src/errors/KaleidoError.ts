export class KaleidoError extends Error {
  constructor(
    message: string,
    public code: string,
    public hint?: string
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
    return new KaleidoError(error.message, "UNEXPECTED_ERROR");
  }

  return new KaleidoError("An unexpected error occurred.", "UNEXPECTED_ERROR");
}
