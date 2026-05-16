import { describe, expect, it } from "vitest";
import { CaatingaError, CaatingaErrorCode } from "../errors/CaatingaError.js";
import { assertSafeSourceAccount } from "./source-account.js";

describe("assertSafeSourceAccount", () => {
  it("should_reject_public_g_address", () => {
    expect(() => assertSafeSourceAccount("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"))
      .toThrow(expect.objectContaining({
        code: CaatingaErrorCode.UNSAFE_SOURCE_ACCOUNT
      }));
  });

  it("should_return_alias_when_non_secret_shape", () => {
    expect(assertSafeSourceAccount("alice")).toBe("alice");
  });

  it("should_throw_CAATINGA_SOURCE_ACCOUNT_REQUIRED_when_undefined", () => {
    try {
      assertSafeSourceAccount(undefined);
      expect.fail("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(CaatingaError);
      expect((error as CaatingaError).code).toBe(CaatingaErrorCode.SOURCE_ACCOUNT_REQUIRED);
    }
  });

  it("should_throw_CAATINGA_UNSAFE_SOURCE_ACCOUNT_when_seed_like", () => {
    try {
      assertSafeSourceAccount("SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
      expect.fail("expected throw");
    } catch (error) {
      expect((error as CaatingaError).code).toBe(CaatingaErrorCode.UNSAFE_SOURCE_ACCOUNT);
    }
  });

  it("should_throw_CAATINGA_UNSAFE_SOURCE_ACCOUNT_when_source_contains_spaces", () => {
    try {
      assertSafeSourceAccount("my secret phrase");
      expect.fail("expected throw");
    } catch (error) {
      expect((error as CaatingaError).code).toBe(CaatingaErrorCode.UNSAFE_SOURCE_ACCOUNT);
    }
  });
});
