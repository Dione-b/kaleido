import { describe, expect, it } from "vitest";
import { CaatingaErrorCode } from "./CaatingaErrorCode.js";
import { toCaatingaError } from "./CaatingaError.js";

describe("toCaatingaError", () => {
  it("should_normalize_Error_instances_to_UNEXPECTED_ERROR", () => {
    expect(toCaatingaError(new Error("boom")).code).toBe(CaatingaErrorCode.UNEXPECTED_ERROR);
  });
});
