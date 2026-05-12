import { describe, expect, it } from "vitest";
import { KaleidoError } from "../errors/KaleidoError.js";
import { assertSafeSourceAccount } from "./source-account.js";

describe("assertSafeSourceAccount", () => {
  it("should_return_source_when_public_g_address", () => {
    expect(assertSafeSourceAccount("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF")).toMatch(/^G/);
  });

  it("should_return_alias_when_non_secret_shape", () => {
    expect(assertSafeSourceAccount("alice")).toBe("alice");
  });

  it("should_throw_SOURCE_ACCOUNT_REQUIRED_when_undefined", () => {
    try {
      assertSafeSourceAccount(undefined);
      expect.fail("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(KaleidoError);
      expect((error as KaleidoError).code).toBe("SOURCE_ACCOUNT_REQUIRED");
    }
  });

  it("should_throw_SECRET_SOURCE_REJECTED_when_seed_like", () => {
    try {
      assertSafeSourceAccount("SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
      expect.fail("expected throw");
    } catch (error) {
      expect((error as KaleidoError).code).toBe("SECRET_SOURCE_REJECTED");
    }
  });

  it("should_throw_SECRET_SOURCE_REJECTED_when_source_contains_spaces", () => {
    try {
      assertSafeSourceAccount("my secret phrase");
      expect.fail("expected throw");
    } catch (error) {
      expect((error as KaleidoError).code).toBe("SECRET_SOURCE_REJECTED");
    }
  });
});
