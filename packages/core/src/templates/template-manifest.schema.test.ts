import { describe, expect, it } from "vitest";
import { KALEIDO_CORE_VERSION } from "../version.js";
import { isCoreVersionCompatible } from "./template-manifest.schema.js";

describe("isCoreVersionCompatible", () => {
  it("should_accept_semver_ranges_that_match_core_version", () => {
    expect(isCoreVersionCompatible("^0.1.0", "0.1.0")).toBe(true);
  });

  it("should_reject_semver_ranges_that_do_not_match_core_version", () => {
    expect(isCoreVersionCompatible("^99.0.0", "0.1.0")).toBe(false);
  });

  it("uses the centralized core version by default", () => {
    expect(KALEIDO_CORE_VERSION).toBe("0.1.0");
    expect(isCoreVersionCompatible("^0.1.0")).toBe(true);
  });
});
