import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { readArtifacts } from "./read-artifacts.js";
import { createInitialArtifacts, writeArtifacts } from "./write-artifacts.js";

describe("writeArtifacts and readArtifacts", () => {
  let tmpDir: string;

  afterEach(async () => {
    if (tmpDir) {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("should_roundtrip_valid_artifacts_json", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "kaleido-art-"));
    const initial = createInitialArtifacts("app");
    initial.networks.testnet = { contracts: {} };

    await writeArtifacts(initial, tmpDir);
    const loaded = await readArtifacts(tmpDir);

    expect(loaded.project).toBe("app");
    expect(loaded.version).toBe(1);
    expect(loaded.networks.testnet?.contracts).toEqual({});

    const raw = await readFile(path.join(tmpDir, "kaleido.artifacts.json"), "utf8");
    expect(JSON.parse(raw).version).toBe(1);
  });

  it("should_throw_ARTIFACTS_NOT_FOUND_when_file_missing", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "kaleido-art-"));
    await expect(readArtifacts(tmpDir)).rejects.toMatchObject({
      code: "ARTIFACTS_NOT_FOUND"
    });
  });

  it("should_throw_ARTIFACTS_INVALID_when_json_malformed", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "kaleido-art-"));
    await writeFile(path.join(tmpDir, "kaleido.artifacts.json"), "{", "utf8");
    await expect(readArtifacts(tmpDir)).rejects.toMatchObject({
      code: "ARTIFACTS_INVALID"
    });
  });

  it("should_throw_ARTIFACTS_INVALID_when_shape_invalid", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "kaleido-art-"));
    await writeFile(
      path.join(tmpDir, "kaleido.artifacts.json"),
      JSON.stringify({ project: "x", version: 2, networks: {} }),
      "utf8"
    );
    await expect(readArtifacts(tmpDir)).rejects.toMatchObject({
      code: "ARTIFACTS_INVALID"
    });
  });
});
