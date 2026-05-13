import { describe, expect, it, vi } from "vitest";
import { KaleidoErrorCode } from "../errors/KaleidoError.js";

const runCommand = vi.hoisted(() => vi.fn());

vi.mock("./run-command.js", () => ({
  runCommand
}));

import { checkBinary } from "./check-binary.js";

describe("checkBinary", () => {
  it("should_throw_RUST_NOT_FOUND_when_rustc_is_missing", async () => {
    runCommand.mockRejectedValueOnce(new Error("not found"));

    await expect(checkBinary("rustc", "hint")).rejects.toMatchObject({
      code: KaleidoErrorCode.RUST_NOT_FOUND
    });

    expect(runCommand).toHaveBeenCalledWith("rustc", ["--version"], {});
  });
});
