import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { KaleidoConfig } from "../config/config.schema.js";
import { createInitialArtifacts, writeArtifacts } from "../artifacts/write-artifacts.js";

const runCommand = vi.hoisted(() => vi.fn());

vi.mock("../shell/run-command.js", () => ({
  runCommand
}));

import { deployContract } from "./deploy-contract.js";

const CONTRACT_ID = `C${"1".repeat(55)}`;

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

describe("deployContract", () => {
  let tmpDir: string;

  beforeEach(() => {
    runCommand.mockReset();
    runCommand.mockImplementation(async (command: string, args: string[]) => {
      if (command === "stellar" && args[0] === "contract" && args[1] === "deploy") {
        return { stdout: `deployed ${CONTRACT_ID}\n`, stderr: "", all: `deployed ${CONTRACT_ID}\n` };
      }
      return { stdout: "0.0.0", stderr: "", all: "0.0.0" };
    });
  });

  afterEach(async () => {
    if (tmpDir) {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("should_update_artifacts_with_contract_id_when_stellar_succeeds", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "kaleido-deploy-"));
    const wasmPath = path.join(tmpDir, "rel", "counter.wasm");
    await mkdir(path.dirname(wasmPath), { recursive: true });
    await writeFile(wasmPath, Buffer.from("wasm-bytes"), "utf8");

    const artifacts = createInitialArtifacts("app");
    await writeArtifacts(artifacts, tmpDir);

    const result = await deployContract({
      config: baseConfig,
      contractName: "counter",
      networkName: "testnet",
      source: "alice",
      cwd: tmpDir
    });

    expect(result.contractId).toBe(CONTRACT_ID);

    const saved = JSON.parse(await readFile(path.join(tmpDir, "kaleido.artifacts.json"), "utf8"));
    expect(saved.networks.testnet.contracts.counter.contractId).toBe(CONTRACT_ID);
    expect(saved.networks.testnet.contracts.counter.wasmHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
