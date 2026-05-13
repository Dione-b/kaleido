import { describe, expect, it } from "vitest";
import { KaleidoErrorCode } from "./KaleidoErrorCode.js";
import { toKaleidoError } from "./KaleidoError.js";

describe("toKaleidoError", () => {
  it("should_normalize_Error_instances_to_UNEXPECTED_ERROR", () => {
    expect(toKaleidoError(new Error("boom")).code).toBe(KaleidoErrorCode.UNEXPECTED_ERROR);
  });
});
