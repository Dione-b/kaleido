import { describe, expect, it } from "vitest";
import { Command } from "commander";
import { registerDevCommand } from "./dev.command.js";

type CommandWithHidden = Command & { _hidden?: boolean };

describe("registerDevCommand", () => {
  it("should_register_dev_as_hidden", () => {
    const program = new Command();
    registerDevCommand(program);
    const dev = program.commands.find((command) => command.name() === "dev");
    expect((dev as CommandWithHidden)?._hidden).toBe(true);
  });
});
