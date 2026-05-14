import { describe, expect, it } from "vitest";
import { isTransientTestnetSmokeFailure } from "./is-transient-testnet-smoke-failure.js";

describe("isTransientTestnetSmokeFailure", () => {
  it("should_return_true_when_log_contains_network_timeout", () => {
    expect(isTransientTestnetSmokeFailure("request i/o timeout")).toBe(true);
  });

  it("should_return_true_when_log_contains_503", () => {
    expect(isTransientTestnetSmokeFailure("upstream returned 503")).toBe(true);
  });

  it("should_return_false_when_log_contains_unsupported_cli_code", () => {
    expect(
      isTransientTestnetSmokeFailure("Error KALEIDO_UNSUPPORTED_CLI_VERSION: bump stellar")
    ).toBe(false);
  });

  it("should_return_false_when_log_contains_version_parse_failure", () => {
    expect(
      isTransientTestnetSmokeFailure("KALEIDO_STELLAR_CLI_VERSION_PARSE_FAILED")
    ).toBe(false);
  });

  it("should_return_false_when_log_contains_invalid_config", () => {
    expect(isTransientTestnetSmokeFailure("KALEIDO_INVALID_CONFIG")).toBe(false);
  });

  it("should_return_false_when_empty", () => {
    expect(isTransientTestnetSmokeFailure("")).toBe(false);
  });
});
