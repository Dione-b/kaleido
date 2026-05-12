import { describe, expect, it } from "vitest";
import { isCoreVersionCompatible } from "./template-manifest.schema.js";

describe("isCoreVersionCompatible", () => {
  it("should_accept_semver_ranges_that_match_core_version", () => {
    expect(isCoreVersionCompatible("^0.1.0", "0.1.0")).toBe(true);
  });

  it("should_reject_semver_ranges_that_do_not_match_core_version", () => {
    expect(isCoreVersionCompatible("^99.0.0", "0.1.0")).toBe(false);
  });
});
