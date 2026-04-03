/**
 * semantic-release：根据约定式提交（feat/fix 等，与 Angular 规范一致）自动算下一版本，
 * 同步所有 package.json、生成 CHANGELOG、打 tag、发 GitHub Release，并附带 macOS DMG。
 * @see https://semantic-release.gitbook.io/
 */
module.exports = {
  branches: ["main"],
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "angular",
        releaseRules: [
          { type: "docs", release: false },
          { type: "style", release: false },
          { type: "chore", release: false },
          { type: "refactor", release: false },
          { type: "test", release: false },
          { type: "build", release: false },
          { type: "ci", release: false },
          // perf 仍作为补丁级发布（与 Angular 惯例一致）
          { type: "perf", release: "patch" },
        ],
      },
    ],
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    [
      "@semantic-release/exec",
      {
        // 先 bump 各包 version，再打包（electron-builder 读取 apps/desktop/package.json 版本）
        prepareCmd:
          "node scripts/sync-workspace-version.mjs ${nextRelease.version} && pnpm run package:desktop",
      },
    ],
    [
      "@semantic-release/git",
      {
        assets: [
          "package.json",
          "apps/web/package.json",
          "apps/server/package.json",
          "apps/desktop/package.json",
          "CHANGELOG.md",
        ],
        message:
          "chore(release): ${nextRelease.version}\n\n${nextRelease.notes}",
      },
    ],
    [
      "@semantic-release/github",
      {
        assets: [{ path: "apps/desktop/release/*.dmg", label: "macOS (DMG)" }],
      },
    ],
  ],
};
