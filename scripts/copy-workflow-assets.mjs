import fs from "node:fs";
import path from "node:path";

const sourceRoot = path.resolve("src/workflows");
const targetRoot = path.resolve("dist/workflows");
const copiedExtensions = new Set([".md", ".mjs", ".json"]);

copyAssets(sourceRoot, targetRoot);

function copyAssets(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    return;
  }
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyAssets(sourcePath, targetPath);
      continue;
    }
    if (!copiedExtensions.has(path.extname(entry.name))) {
      continue;
    }
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  }
}
