import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

const IGNORE_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  "packed",
  "packed-unpacked-package-jsons"
]);

const IGNORE_FILES = new Set([
  "pnpm-lock.yaml",
  "replace.js"
]);

function walk(dir) {
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    if (IGNORE_DIRS.has(name)) continue;
    const fullPath = path.join(dir, name);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...walk(fullPath));
    } else {
      if (IGNORE_FILES.has(name)) continue;
      files.push(fullPath);
    }
  }
  return files;
}

const allFiles = walk(ROOT);

let changed = 0;
for (const file of allFiles) {
  try {
    const content = fs.readFileSync(file, "utf8");
    if (content.includes("@kaleido/")) {
      const updated = content
        .replace(/@kaleido\/cli/g, "@kaleido-xlm/cli")
        .replace(/@kaleido\/core/g, "@kaleido-xlm/core")
        .replace(/@kaleido\/client/g, "@kaleido-xlm/client");
      
      if (content !== updated) {
        fs.writeFileSync(file, updated, "utf8");
        console.log(`Updated: ${path.relative(ROOT, file)}`);
        changed++;
      }
    }
  } catch (e) {
    // Ignore binary files or unreadable files
  }
}

console.log(`Done! Changed ${changed} files.`);
