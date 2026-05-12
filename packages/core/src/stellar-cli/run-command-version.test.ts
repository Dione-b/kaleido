import { beforeEach, describe, expect, it, vi } from "vitest";
import { KaleidoErrorCode } from "../errors/KaleidoError.js";

const execaMock = vi.hoisted(() => vi.fn());
const runCommandMock = vi.hoisted(() => vi.fn());
const checkStellarCliVersionMock = vi.hoisted(() => vi.fn());

describe("checkStellarCliVersion", () => {
  beforeEach(() => {
    vi.resetModules();
    runCommandMock.mockReset();
  });

  it("checks stellar --version and returns parsed version", async () => {
    vi.doMock("../shell/run-command.js", () => ({
      runCommand: runCommandMock
    }));
    const { checkStellarCliVersion } = await import("./check-stellar-cli-version.js");
    runCommandMock.mockResolvedValueOnce({
      stdout: "stellar 22.0.1",
      stderr: "",
      all: "stellar 22.0.1"
    });

    await expect(checkStellarCliVersion({ allowUntested: false })).resolves.toBe("22.0.1");
    expect(runCommandMock).toHaveBeenCalledWith("stellar", ["--version"], {
      skipStellarVersionCheck: true
    });
  });

  it("normalizes missing stellar binary to KALEIDO_STELLAR_CLI_NOT_FOUND", async () => {
    vi.doMock("../shell/run-command.js", () => ({
      runCommand: runCommandMock
    }));
    const { checkStellarCliVersion } = await import("./check-stellar-cli-version.js");
    runCommandMock.mockRejectedValueOnce(Object.assign(new Error("not found"), { code: "ENOENT" }));

    await expect(checkStellarCliVersion({ allowUntested: false })).rejects.toMatchObject({
      code: KaleidoErrorCode.STELLAR_CLI_NOT_FOUND
    });
  });
});

describe("runCommand Stellar CLI version gate", () => {
  beforeEach(() => {
    vi.resetModules();
    execaMock.mockReset();
    checkStellarCliVersionMock.mockReset();
    vi.doUnmock("../shell/run-command.js");
    vi.doMock("execa", () => ({
      execa: execaMock
    }));
    vi.doMock("./check-stellar-cli-version.js", () => ({
      checkStellarCliVersion: checkStellarCliVersionMock
    }));
  });

  it("checks the Stellar CLI version before running stellar commands", async () => {
    const { runCommand } = await import("../shell/run-command.js");
    checkStellarCliVersionMock.mockResolvedValueOnce("22.0.1");
    execaMock.mockResolvedValueOnce({ stdout: "ok", stderr: "", all: "ok" });

    await expect(runCommand("stellar", ["contract", "build"])).resolves.toEqual({
      stdout: "ok",
      stderr: "",
      all: "ok"
    });

    expect(checkStellarCliVersionMock).toHaveBeenCalledWith({ allowUntested: false });
    expect(execaMock).toHaveBeenCalledWith("stellar", ["contract", "build"], {
      cwd: undefined,
      env: undefined,
      all: true,
      reject: true
    });
  });

  it("threads the local untested-version override into the Stellar CLI version gate", async () => {
    const { runCommand } = await import("../shell/run-command.js");
    checkStellarCliVersionMock.mockResolvedValueOnce("22.0.2");
    execaMock.mockResolvedValueOnce({ stdout: "ok", stderr: "", all: "ok" });

    await runCommand("stellar", ["contract", "deploy"], {
      allowUntestedStellarCli: true
    });

    expect(checkStellarCliVersionMock).toHaveBeenCalledWith({ allowUntested: true });
  });

  it("skips the Stellar CLI version gate when requested by the version check itself", async () => {
    const { runCommand } = await import("../shell/run-command.js");
    execaMock.mockResolvedValueOnce({ stdout: "stellar 22.0.1", stderr: "", all: "stellar 22.0.1" });

    await runCommand("stellar", ["--version"], {
      skipStellarVersionCheck: true
    });

    expect(checkStellarCliVersionMock).not.toHaveBeenCalled();
  });

  it("normalizes missing stellar binary to KALEIDO_STELLAR_CLI_NOT_FOUND", async () => {
    const { runCommand } = await import("../shell/run-command.js");
    checkStellarCliVersionMock.mockResolvedValueOnce("22.0.1");
    execaMock.mockRejectedValueOnce(Object.assign(new Error("not found"), { code: "ENOENT" }));

    await expect(runCommand("stellar", ["contract", "build"])).rejects.toMatchObject({
      code: KaleidoErrorCode.STELLAR_CLI_NOT_FOUND
    });
  });

  it("preserves version gate KaleidoError codes", async () => {
    const { KaleidoError } = await import("../errors/KaleidoError.js");
    const { runCommand } = await import("../shell/run-command.js");
    checkStellarCliVersionMock.mockRejectedValueOnce(
      new KaleidoError(
        "Stellar CLI 99.0.0 is newer than the tested maximum.",
        KaleidoErrorCode.UNTESTED_CLI_VERSION
      )
    );

    await expect(runCommand("stellar", ["contract", "build"])).rejects.toMatchObject({
      code: KaleidoErrorCode.UNTESTED_CLI_VERSION
    });
    expect(execaMock).not.toHaveBeenCalled();
  });
});
