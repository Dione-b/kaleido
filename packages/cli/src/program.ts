import { Command } from "commander";
import { registerBuildCommand } from "./commands/build.command.js";
import { registerDeployCommand } from "./commands/deploy.command.js";
import { registerDevCommand } from "./commands/dev.command.js";
import { registerGenerateCommand } from "./commands/generate.command.js";
import { registerInitCommand } from "./commands/init.command.js";
import { registerInvokeCommand } from "./commands/invoke.command.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("kaleido")
    .description("Developer toolkit for Stellar/Soroban dApps")
    .version("0.1.0");

  registerInitCommand(program);
  registerDevCommand(program);
  registerBuildCommand(program);
  registerDeployCommand(program);
  registerGenerateCommand(program);
  registerInvokeCommand(program);

  return program;
}
