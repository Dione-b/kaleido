import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { KaleidoConfig } from "../config/config.schema.js";
import { KaleidoError, KaleidoErrorCode } from "../errors/KaleidoError.js";

const runCommand = vi.hoisted(() => vi.fn());

vi.mock("../shell/run-command.js", () => ({
  runCommand
}));

import { buildContract } from "./build-contract.js";

const baseConfig: KaleidoConfig = {
  project: "app",
  defaultNetwork: "testnet",
  contracts: {
    counter: {
      path: "./contracts/counter",
      wasm: "./rel/counter.wasm",
      dependsOn: [],
      deployArgs: {}
    }
  },
  networks: {
    testnet: {
      rpcUrl: "https://soroban-testnet.stellar.org",
      networkPassphrase: "Test SDF Network ; September 2015"
    }
  },
  frontend: { framework: "vite-react", bindingsOutput: "./out" }
};

describe("buildContract", () => {
  let tmpDir: string;

  beforeEach(() => {
    runCommand.mockReset();
    runCommand.mockResolvedValue({ stdout: "ok", stderr: "", all: "ok" });
  });

  afterEach(async () => {
    if (tmpDir) {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("should_run_stellar_contract_build_in_contract_source_dir_when_binaries_ok", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "kaleido-build-"));
    const sourceDir = path.join(tmpDir, "contracts", "counter");
    const wasmPath = path.join(tmpDir, "rel", "counter.wasm");
    await mkdir(sourceDir, { recursive: true });
    await mkdir(path.dirname(wasmPath), { recursive: true });
    await writeFile(wasmPath, Buffer.from([0x00, 0x61, 0x73, 0x6d]), "binary");

    await buildContract({
      config: baseConfig,
      contractName: "counter",
      cwd: tmpDir
    });

    expect(runCommand).toHaveBeenCalledWith("stellar", ["contract", "build"], {
      cwd: sourceDir,
      failureCode: KaleidoErrorCode.BUILD_FAILED
    });
  });

  it("passes the untested Stellar CLI override into the preflight version check", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "kaleido-build-"));
    const sourceDir = path.join(tmpDir, "contracts", "counter");
    const wasmPath = path.join(tmpDir, "rel", "counter.wasm");
    await mkdir(sourceDir, { recursive: true });
    await mkdir(path.dirname(wasmPath), { recursive: true });
    await writeFile(wasmPath, Buffer.from([0x00, 0x61, 0x73, 0x6d]), "binary");

    await buildContract({
      config: baseConfig,
      contractName: "counter",
      cwd: tmpDir,
      allowUntestedStellarCli: true
    });

    expect(runCommand).toHaveBeenCalledWith("stellar", ["--version"], {
      allowUntestedStellarCli: true
    });
    expect(runCommand).toHaveBeenCalledWith("stellar", ["contract", "build"], {
      cwd: sourceDir,
      allowUntestedStellarCli: true,
      failureCode: KaleidoErrorCode.BUILD_FAILED
    });
  });

  it("should_throw_RUST_TARGET_NOT_FOUND_when_stellar_build_reports_missing_wasm32_unknown_unknown", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "kaleido-build-"));
    const sourceDir = path.join(tmpDir, "contracts", "counter");
    await mkdir(sourceDir, { recursive: true });

    runCommand.mockImplementation(async (command: string, args: string[]) => {
      if (command === "stellar" && args[0] === "contract" && args[1] === "build") {
        throw new KaleidoError(
          "Command failed: stellar contract build",
          KaleidoErrorCode.BUILD_FAILED,
          "the wasm32-unknown-unknown target may not be installed",
          new Error("error: the wasm32-unknown-unknown target is not installed. run `rustup target add wasm32-unknown-unknown`")
        );
      }

      return { stdout: "ok", stderr: "", all: "ok" };
    });

    await expect(
      buildContract({
        config: baseConfig,
        contractName: "counter",
        cwd: tmpDir
      })
    ).rejects.toMatchObject({
      code: KaleidoErrorCode.RUST_TARGET_NOT_FOUND
    });
  });

  it("should_rethrow_BUILD_FAILED_when_stellar_build_failure_is_unrelated_to_missing_target", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "kaleido-build-"));
    const sourceDir = path.join(tmpDir, "contracts", "counter");
    await mkdir(sourceDir, { recursive: true });

    runCommand.mockImplementation(async (command: string, args: string[]) => {
      if (command === "stellar" && args[0] === "contract" && args[1] === "build") {
        throw new KaleidoError(
          "Command failed: stellar contract build",
          KaleidoErrorCode.BUILD_FAILED,
          "compilation error: missing semicolon",
          new Error("error: expected `;`")
        );
      }

      return { stdout: "ok", stderr: "", all: "ok" };
    });

    await expect(
      buildContract({
        config: baseConfig,
        contractName: "counter",
        cwd: tmpDir
      })
    ).rejects.toMatchObject({
      code: KaleidoErrorCode.BUILD_FAILED
    });
  });

  it("does not mask Stellar CLI version errors from the preflight check", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "kaleido-build-"));
    const sourceDir = path.join(tmpDir, "contracts", "counter");
    await mkdir(sourceDir, { recursive: true });
    runCommand.mockImplementation(async (command: string, args: string[]) => {
      if (command === "stellar" && args[0] === "--version") {
        throw new KaleidoError(
          "Stellar CLI 99.0.0 is newer than the tested maximum.",
          KaleidoErrorCode.UNTESTED_CLI_VERSION
        );
      }

      return { stdout: "ok", stderr: "", all: "ok" };
    });

    await expect(buildContract({
      config: baseConfig,
      contractName: "counter",
      cwd: tmpDir
    })).rejects.toMatchObject({
      code: KaleidoErrorCode.UNTESTED_CLI_VERSION
    });
  });
});
