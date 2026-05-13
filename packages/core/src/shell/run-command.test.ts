import { beforeEach, describe, expect, it, vi } from "vitest";
import { execa } from "execa";
import { KaleidoErrorCode } from "../errors/KaleidoError.js";
import { runCommand } from "./run-command.js";

vi.mock("execa", () => ({ execa: vi.fn() }));

const execaMock = vi.mocked(execa);

describe("runCommand failureCode", () => {
  beforeEach(() => {
    execaMock.mockReset();
  });

  it("should_throw_with_provided_failureCode_when_execa_rejects", async () => {
    execaMock.mockRejectedValueOnce({ all: "boom", code: 1 });

    await expect(
      runCommand("false", [], {
        skipStellarVersionCheck: true,
        failureCode: KaleidoErrorCode.BUILD_FAILED
      })
    ).rejects.toMatchObject({
      code: KaleidoErrorCode.BUILD_FAILED
    });
  });

  it("should_default_to_COMMAND_FAILED_when_failureCode_is_absent", async () => {
    execaMock.mockRejectedValueOnce({ all: "boom", code: 1 });

    await expect(
      runCommand("false", [], { skipStellarVersionCheck: true })
    ).rejects.toMatchObject({
      code: KaleidoErrorCode.COMMAND_FAILED
    });
  });
});
