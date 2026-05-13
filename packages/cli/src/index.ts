#!/usr/bin/env node
import { createProgram } from "./program.js";

const program = createProgram();

void program.parseAsync(process.argv).catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
