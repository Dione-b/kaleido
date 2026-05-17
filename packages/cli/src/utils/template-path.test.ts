import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CaatingaErrorCode } from "@caatinga/core";

const accessMock = vi.hoisted(() => vi.fn());

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    access: accessMock
  };
});

import { resolveTemplateDir } from "./template-path.js";

describe("resolveTemplateDir", () => {
  const previousTemplatesDir = process.env.CAATINGA_TEMPLATES_DIR;

  beforeEach(() => {
    delete process.env.CAATINGA_TEMPLATES_DIR;
    accessMock.mockRejectedValue(new Error("ENOENT"));
  });

  afterEach(() => {
    accessMock.mockReset();
    if (previousTemplatesDir === undefined) {
      delete process.env.CAATINGA_TEMPLATES_DIR;
    } else {
      process.env.CAATINGA_TEMPLATES_DIR = previousTemplatesDir;
    }
  });

  it("throws TEMPLATE_NOT_FOUND when no template candidate is accessible", async () => {
    await expect(resolveTemplateDir("__caatinga_nonexistent_template__")).rejects.toMatchObject({
      code: CaatingaErrorCode.TEMPLATE_NOT_FOUND
    });
  });
});
