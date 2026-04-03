#!/usr/bin/env node
/**
 * 将单一 semver 写回仓库内所有业务 package.json（根 + apps/*），
 * 供 semantic-release prepare 阶段在打包桌面端之前执行。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

const version = process.argv[2];
if (
  !version ||
  !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/.test(version)
) {
  console.error("用法: node scripts/sync-workspace-version.mjs <semver>");
  process.exit(1);
}

const manifestPaths = [
  path.join(repoRoot, "package.json"),
  path.join(repoRoot, "apps", "web", "package.json"),
  path.join(repoRoot, "apps", "server", "package.json"),
  path.join(repoRoot, "apps", "desktop", "package.json"),
];

for (const file of manifestPaths) {
  if (!fs.existsSync(file)) {
    console.error("缺少文件:", file);
    process.exit(1);
  }
  const raw = fs.readFileSync(file, "utf8");
  const json = JSON.parse(raw);
  json.version = version;
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
  console.log("已更新 version:", version, "→", path.relative(repoRoot, file));
}
