import { describe, expect, it } from "vitest";
import { KaleidoErrorCode } from "../errors/KaleidoError.js";
import {
  STELLAR_CLI_MIN_VERSION,
  STELLAR_CLI_TESTED_MAX_VERSION,
  assertSupportedStellarCliVersion,
  parseStellarCliVersion
} from "./version.js";

describe("Stellar CLI version contract", () => {
  it("parses semver from known Stellar CLI outputs", () => {
    expect(parseStellarCliVersion("stellar 22.0.1")).toBe("22.0.1");
    expect(parseStellarCliVersion("stellar-cli 21.3.0 (build abc123)")).toBe("21.3.0");
    expect(parseStellarCliVersion("Stellar CLI version 22.1.0")).toBe("22.1.0");
  });

  it("fails when version output has no semver", () => {
    expect(() => parseStellarCliVersion("stellar dev build")).toThrowError(
      expect.objectContaining({
        code: KaleidoErrorCode.STELLAR_CLI_VERSION_PARSE_FAILED
      })
    );
  });

  it("rejects versions below the minimum", () => {
    expect(() =>
      assertSupportedStellarCliVersion({
        version: "0.1.0",
        allowUntested: false
      })
    ).toThrowError(
      expect.objectContaining({
        code: KaleidoErrorCode.UNSUPPORTED_CLI_VERSION
      })
    );
  });

  it("rejects the adjacent version below the minimum", () => {
    expect(() =>
      assertSupportedStellarCliVersion({
        version: "21.9.9",
        allowUntested: false
      })
    ).toThrowError(
      expect.objectContaining({
        code: KaleidoErrorCode.UNSUPPORTED_CLI_VERSION
      })
    );
  });

  it("accepts the minimum supported version boundary", () => {
    expect(
      assertSupportedStellarCliVersion({
        version: "22.0.0",
        allowUntested: false
      })
    ).toBe("22.0.0");
  });

  it("accepts the tested maximum version boundary", () => {
    expect(
      assertSupportedStellarCliVersion({
        version: "22.0.1",
        allowUntested: false
      })
    ).toBe("22.0.1");
  });

  it("rejects versions above the tested maximum by default", () => {
    expect(() =>
      assertSupportedStellarCliVersion({
        version: "99.0.0",
        allowUntested: false
      })
    ).toThrowError(
      expect.objectContaining({
        code: KaleidoErrorCode.UNTESTED_CLI_VERSION
      })
    );
  });

  it("rejects the adjacent version above the tested maximum by default", () => {
    expect(() =>
      assertSupportedStellarCliVersion({
        version: "22.0.2",
        allowUntested: false
      })
    ).toThrowError(
      expect.objectContaining({
        code: KaleidoErrorCode.UNTESTED_CLI_VERSION
      })
    );
  });

  it("allows versions above the tested maximum with explicit local override", () => {
    expect(
      assertSupportedStellarCliVersion({
        version: "99.0.0",
        allowUntested: true
      })
    ).toBe("99.0.0");
  });

  it("preserves prerelease versions before rejecting unsupported prerelease CLI builds", () => {
    const version = parseStellarCliVersion("stellar 22.0.0-rc.1");

    expect(version).toBe("22.0.0-rc.1");
    expect(() =>
      assertSupportedStellarCliVersion({
        version,
        allowUntested: false
      })
    ).toThrowError(
      expect.objectContaining({
        code: KaleidoErrorCode.UNSUPPORTED_CLI_VERSION
      })
    );
  });

  it("preserves build metadata in parsed version output", () => {
    expect(parseStellarCliVersion("stellar 22.0.1+build.5")).toBe("22.0.1+build.5");
  });

  it("declares concrete supported range constants", () => {
    expect(STELLAR_CLI_MIN_VERSION).toBe("22.0.0");
    expect(STELLAR_CLI_TESTED_MAX_VERSION).toBe("22.0.1");
  });
});
