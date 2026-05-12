import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { KaleidoConfig } from "../config/config.schema.js";

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
      wasm: "./rel/counter.wasm"
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
      cwd: sourceDir
    });
  });
});
