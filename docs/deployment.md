# 运维部署文档

## 1. 构建流程

1. 安装依赖

```bash
pnpm install --frozen-lockfile
```

2. 执行质量检查

```bash
pnpm run lint
pnpm run typecheck
pnpm run format:check
```

3. 执行构建

```bash
pnpm run build
```

## 2. 桌面端打包

```bash
pnpm run package:desktop
```

产物目录：`apps/desktop/release`

- macOS：`.dmg`
- Windows：`.exe`（NSIS）

## 3. CI 建议步骤

```bash
pnpm install --frozen-lockfile
pnpm run lint
pnpm run typecheck
pnpm run build
```

如需要自动打包桌面端：

```bash
pnpm run package:desktop
```

## 4. 运行监控建议

- 服务健康检查：`GET /health`
- 关键日志：
  - Electron 主进程启动日志
  - NestJS 服务启动与端口监听日志
- 异常处理：
  - 若端口冲突（3000/5173），需先释放旧进程再重启。

## 5. 发布注意事项

- Windows 打包建议在 Windows Runner 执行，macOS 打包建议在 macOS Runner 执行。
- 如涉及签名与公证，请在 CI 中注入对应证书与密钥环境变量。

## 6. 自动化版本与 GitHub Release

默认分支 **`main`** 在推送后，由 [GitHub Actions](https://github.com/HarveyWebLee/wallpaper/actions) 中的 **Release** 工作流执行：

1. **质量门禁**：`lint` / `typecheck` / `format:check`
2. **semantic-release**：根据自上次 tag 以来的 [约定式提交](https://www.conventionalcommits.org/en/v1.0.0/)（如 `feat:` / `fix:` / `perf:`，与 Angular 规范一致）计算下一版本；`chore` / `docs` / `test` 等默认 **不触发** 新版本
3. **版本同步**：`scripts/sync-workspace-version.mjs` 将版本号写入根目录与 `apps/web`、`apps/server`、`apps/desktop` 的 `package.json`
4. **打包**：`pnpm run package:desktop` 生成 DMG
5. **Git 提交与 tag**：附带 `CHANGELOG.md` 的 `chore(release): x.y.z` 提交与对应 tag
6. **GitHub Releases**：创建 Release 并上传 `apps/desktop/release/*.dmg`（当前 Runner 为 `macos-latest`，产物为对应架构的 macOS 安装包）

本地模拟（不推 tag、不写仓库）需可访问 GitHub API 校验权限，请先导出 **Fine-grained 或 classic PAT**（具备 Contents、Metadata 等 Release 所需权限）：

```bash
export GH_TOKEN=ghp_xxxx   # 或 GITHUB_TOKEN
pnpm run release:dry-run
```

若需 Windows 安装包，可另增 `runs-on: windows-latest` 的打包任务并上传到同一 Release（可用 `softprops/action-gh-release` 等按 tag 附加资产）。
