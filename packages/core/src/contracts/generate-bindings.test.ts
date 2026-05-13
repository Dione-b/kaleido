import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { KaleidoConfig } from "../config/config.schema.js";
import { createInitialArtifacts, writeArtifacts } from "../artifacts/write-artifacts.js";

const runCommand = vi.hoisted(() => vi.fn());

vi.mock("../shell/run-command.js", () => ({
  runCommand
}));

import { generateBindings } from "./generate-bindings.js";

const CONTRACT_ID = `C${"2".repeat(55)}`;

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
  frontend: { framework: "vite-react", bindingsOutput: "./src/gen" }
};

describe("generateBindings", () => {
  let tmpDir: string;

  beforeEach(() => {
    runCommand.mockReset();
    runCommand.mockImplementation(async (command: string, args: string[]) => {
      if (command === "stellar" && args[0] === "contract" && args[1] === "bindings") {
        return { stdout: "generated", stderr: "", all: "generated" };
      }
      return { stdout: "0.0.0", stderr: "", all: "0.0.0" };
    });
  });

  afterEach(async () => {
    if (tmpDir) {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("should_call_stellar_bindings_with_contract_id_and_output_dir", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "kaleido-gen-"));

    const artifacts = createInitialArtifacts("app");
    artifacts.networks.testnet = {
      contracts: {
        counter: {
          contractId: CONTRACT_ID,
          wasmHash: "abc",
          deployedAt: "2026-05-11T12:00:00.000Z",
          sourcePath: "./contracts/counter",
          wasmPath: "./rel/counter.wasm",
          dependencies: [],
          resolvedDeployArgs: {}
        }
      },
      dependencyGraph: {}
    };
    await writeArtifacts(artifacts, tmpDir);

    const result = await generateBindings({
      config: baseConfig,
      contractName: "counter",
      networkName: "testnet",
      cwd: tmpDir
    });

    expect(result.outputDir).toBe(path.join(tmpDir, "src/gen/counter"));
    expect(runCommand).toHaveBeenCalledWith(
      "stellar",
      expect.arrayContaining([
        "contract",
        "bindings",
        "typescript",
        "--contract-id",
        CONTRACT_ID,
        "--output-dir",
        result.outputDir,
        "--overwrite"
      ]),
      { cwd: tmpDir }
    );
  });

  it("should_throw_KALEIDO_ARTIFACT_NOT_FOUND_when_not_deployed", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "kaleido-gen-"));
    await writeArtifacts(createInitialArtifacts("app"), tmpDir);

    await expect(
      generateBindings({
        config: baseConfig,
        contractName: "counter",
        networkName: "testnet",
        cwd: tmpDir
      })
    ).rejects.toMatchObject({ code: "KALEIDO_ARTIFACT_NOT_FOUND" });
  });
});
