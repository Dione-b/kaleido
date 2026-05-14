import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { KaleidoConfig } from "../config/config.schema.js";
import { createInitialArtifacts, writeArtifacts } from "../artifacts/write-artifacts.js";
import { KaleidoError, KaleidoErrorCode } from "../errors/KaleidoError.js";

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

  it("should_parse_contract_id_from_stdout_when_combined_output_is_empty", async () => {
    runCommand.mockImplementation(async (command: string, args: string[]) => {
      if (command === "stellar" && args[0] === "contract" && args[1] === "deploy") {
        return { stdout: `deployed ${CONTRACT_ID}\n`, stderr: "", all: "" };
      }
      return { stdout: "0.0.0", stderr: "", all: "0.0.0" };
    });

    tmpDir = await mkdtemp(path.join(os.tmpdir(), "kaleido-deploy-"));
    const wasmPath = path.join(tmpDir, "rel", "counter.wasm");
    await mkdir(path.dirname(wasmPath), { recursive: true });
    await writeFile(wasmPath, Buffer.from("wasm-bytes"), "utf8");
    await writeArtifacts(createInitialArtifacts("app"), tmpDir);

    const result = await deployContract({
      config: baseConfig,
      contractName: "counter",
      networkName: "testnet",
      source: "alice",
      cwd: tmpDir
    });

    expect(result.contractId).toBe(CONTRACT_ID);
  });

  it("should_map_stellar_deploy_command_failures_to_DEPLOY_FAILED", async () => {
    runCommand.mockImplementation(async (command: string, args: string[]) => {
      if (command === "stellar" && args[0] === "contract" && args[1] === "deploy") {
        throw new KaleidoError(
          "Command failed: stellar contract deploy",
          KaleidoErrorCode.DEPLOY_FAILED,
          "stellar stderr here"
        );
      }
      return { stdout: "0.0.0", stderr: "", all: "0.0.0" };
    });

    tmpDir = await mkdtemp(path.join(os.tmpdir(), "kaleido-deploy-"));
    const wasmPath = path.join(tmpDir, "rel", "counter.wasm");
    await mkdir(path.dirname(wasmPath), { recursive: true });
    await writeFile(wasmPath, Buffer.from("wasm-bytes"), "utf8");
    await writeArtifacts(createInitialArtifacts("app"), tmpDir);

    await expect(
      deployContract({
        config: baseConfig,
        contractName: "counter",
        networkName: "testnet",
        source: "alice",
        cwd: tmpDir
      })
    ).rejects.toMatchObject({ code: KaleidoErrorCode.DEPLOY_FAILED });
  });

  it("should_skip_stellar_contract_deploy_when_artifact_has_contractId_and_force_is_false", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "kaleido-deploy-skip-"));
    const wasmPath = path.join(tmpDir, "rel", "counter.wasm");
    await mkdir(path.dirname(wasmPath), { recursive: true });
    await writeFile(wasmPath, Buffer.from("wasm-bytes"), "utf8");

    const artifacts = createInitialArtifacts("app");
    artifacts.networks.testnet = {
      contracts: {
        counter: {
          contractId: CONTRACT_ID,
          wasmHash: "a".repeat(64),
          deployedAt: "2026-05-12T00:00:00.000Z",
          sourcePath: "./contracts/counter",
          wasmPath: "./rel/counter.wasm",
          dependencies: [],
          resolvedDeployArgs: {}
        }
      },
      dependencyGraph: { counter: [] }
    };
    await writeArtifacts(artifacts, tmpDir);

    const result = await deployContract({
      config: baseConfig,
      contractName: "counter",
      networkName: "testnet",
      source: "alice",
      cwd: tmpDir,
      force: false
    });

    expect(result.skipped).toBe(true);
    expect(result.contractId).toBe(CONTRACT_ID);
    expect(runCommand).not.toHaveBeenCalledWith("stellar", expect.arrayContaining(["contract", "deploy"]));
  });

  it("should_throw_DEPLOY_ARG_PLACEHOLDER_UNRESOLVED_when_resolved_args_still_contain_placeholders", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "kaleido-deploy-"));
    const wasmPath = path.join(tmpDir, "rel", "counter.wasm");
    await mkdir(path.dirname(wasmPath), { recursive: true });
    await writeFile(wasmPath, Buffer.from("wasm-bytes"), "utf8");
    await writeArtifacts(createInitialArtifacts("app"), tmpDir);

    await expect(
      deployContract({
        config: baseConfig,
        contractName: "counter",
        networkName: "testnet",
        source: "alice",
        cwd: tmpDir,
        resolvedDeployArgs: { initArg: "${contracts.x}" }
      })
    ).rejects.toMatchObject({
      code: KaleidoErrorCode.DEPLOY_ARG_PLACEHOLDER_UNRESOLVED
    });
  });
});
