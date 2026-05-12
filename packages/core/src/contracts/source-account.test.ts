import { describe, expect, it } from "vitest";
import { KaleidoError, KaleidoErrorCode } from "../errors/KaleidoError.js";
import { assertSafeSourceAccount } from "./source-account.js";

describe("assertSafeSourceAccount", () => {
  it("should_return_source_when_public_g_address", () => {
    expect(assertSafeSourceAccount("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF")).toMatch(/^G/);
  });

  it("should_return_alias_when_non_secret_shape", () => {
    expect(assertSafeSourceAccount("alice")).toBe("alice");
  });

  it("should_throw_KALEIDO_SOURCE_ACCOUNT_REQUIRED_when_undefined", () => {
    try {
      assertSafeSourceAccount(undefined);
      expect.fail("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(KaleidoError);
      expect((error as KaleidoError).code).toBe(KaleidoErrorCode.SOURCE_ACCOUNT_REQUIRED);
    }
  });

  it("should_throw_KALEIDO_UNSAFE_SOURCE_ACCOUNT_when_seed_like", () => {
    try {
      assertSafeSourceAccount("SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
      expect.fail("expected throw");
    } catch (error) {
      expect((error as KaleidoError).code).toBe(KaleidoErrorCode.UNSAFE_SOURCE_ACCOUNT);
    }
  });

  it("should_throw_KALEIDO_UNSAFE_SOURCE_ACCOUNT_when_source_contains_spaces", () => {
    try {
      assertSafeSourceAccount("my secret phrase");
      expect.fail("expected throw");
    } catch (error) {
      expect((error as KaleidoError).code).toBe(KaleidoErrorCode.UNSAFE_SOURCE_ACCOUNT);
    }
  });
});
