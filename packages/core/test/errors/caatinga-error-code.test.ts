import { describe, expect, it } from "vitest";
import { CaatingaErrorCode } from "../../src/errors/CaatingaError.js";

describe("CaatingaErrorCode", () => {
  it("all public error codes use CAATINGA_ prefix", () => {
    for (const code of Object.values(CaatingaErrorCode)) {
      expect(code.startsWith("CAATINGA_")).toBe(true);
    }
  });
});
