import { describe, expect, it } from "vitest";
import { KaleidoErrorCode } from "../../src/errors/KaleidoError.js";

describe("KaleidoErrorCode", () => {
  it("all public error codes use KALEIDO_ prefix", () => {
    for (const code of Object.values(KaleidoErrorCode)) {
      expect(code.startsWith("KALEIDO_")).toBe(true);
    }
  });
});
