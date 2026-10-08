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
        // 仅同步各包 version；桌面端安装包由 CI 的跨平台打包矩阵（见 release.yml 的 package 任务）构建并上传
        prepareCmd:
          "node scripts/sync-workspace-version.mjs ${nextRelease.version}",
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
    // 创建 GitHub Release（版本/变更日志）；各平台安装包由 release.yml 的 package 任务按 tag 附加为资产
    "@semantic-release/github",
  ],
};
