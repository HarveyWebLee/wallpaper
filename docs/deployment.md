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

本机（按当前操作系统默认目标）：

```bash
pnpm run package:desktop
```

指定平台（需在对应系统或具备交叉工具链的环境执行）：

```bash
# macOS（.dmg）
pnpm --filter @wallpaper/desktop exec electron-builder --mac --publish never
# Windows（.exe / NSIS）
pnpm --filter @wallpaper/desktop exec electron-builder --win --publish never
# Linux（.AppImage + .deb；.deb 需系统具备 fakeroot/dpkg）
pnpm --filter @wallpaper/desktop exec electron-builder --linux --publish never
```

产物目录：`apps/desktop/release`

- macOS：`.dmg`
- Windows：`.exe`（NSIS，支持自定义安装目录）
- Linux：`.AppImage`（便携，赋可执行权限即可运行）与 `.deb`（`sudo dpkg -i` 安装到 `/opt`，并注册 `wallpaper-screensaver` 命令、桌面入口与图标）

应用图标源文件为 `apps/desktop/build/icon.svg`，栅格化产物 `apps/desktop/build/icon.png`（1024×1024）。各平台图标（icns/ico/png）由 electron-builder 自动从该 PNG 生成。

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

- 各平台安装包建议在对应系统的 Runner 上构建（CI 已按此配置矩阵）。
- 代码签名与公证通过 **环境变量 / GitHub Secrets** 注入；**未配置时自动跳过**，仅产出未签名安装包，CI 不会因此失败。

| Secret                        | 平台    | 用途                                                                   |
| ----------------------------- | ------- | ---------------------------------------------------------------------- |
| `MAC_CSC_LINK`                | macOS   | Developer ID 证书（base64 或路径），映射到 electron-builder `CSC_LINK` |
| `MAC_CSC_KEY_PASSWORD`        | macOS   | 证书密码，映射到 `CSC_KEY_PASSWORD`                                    |
| `APPLE_ID`                    | macOS   | 公证所用 Apple 账号                                                    |
| `APPLE_APP_SPECIFIC_PASSWORD` | macOS   | App 专用密码                                                           |
| `APPLE_TEAM_ID`               | macOS   | 开发者团队 ID                                                          |
| `WIN_CSC_LINK`                | Windows | 代码签名证书（base64 或路径）                                          |
| `WIN_CSC_KEY_PASSWORD`        | Windows | 证书密码                                                               |

公证逻辑见 `apps/desktop/build/notarize.cjs`（electron-builder `afterSign` 钩子）：仅在 macOS 且检测到上述 Apple 凭据时执行 `notarytool` 提交与 `stapler` 装订，否则跳过。hardened runtime 与 entitlements 见 `apps/desktop/build/entitlements.mac.plist`。

## 6. 自动化版本与 GitHub Release

默认分支 **`main`** 在推送后，由 [GitHub Actions](https://github.com/HarveyWebLee/wallpaper/actions) 中的 **Release** 工作流执行，分为两个阶段：

**`release` 任务（`ubuntu-latest`）**

1. **质量门禁**：`lint` / `typecheck` / `format:check`
2. **semantic-release**：根据自上次 tag 以来的 [约定式提交](https://www.conventionalcommits.org/en/v1.0.0/)（如 `feat:` / `fix:` / `perf:`，与 Angular 规范一致）计算下一版本；`chore` / `docs` / `test` 等默认 **不触发** 新版本
3. **版本同步**：`scripts/sync-workspace-version.mjs` 将版本号写入根目录与 `apps/web`、`apps/server`、`apps/desktop` 的 `package.json`
4. **Git 提交与 tag**：附带 `CHANGELOG.md` 的 `chore(release): x.y.z` 提交与对应 tag
5. **GitHub Releases**：创建对应 Release（此阶段不含安装包资产），并输出 `tag` 与 `published` 供下一阶段使用

**`package` 任务（矩阵：`macos-latest` / `windows-latest` / `ubuntu-latest`，仅在本次确有发布时运行）**

6. 检出该 tag → `pnpm install` → `pnpm run build` → `electron-builder --mac|--win|--linux` 分别产出 **DMG / NSIS exe / AppImage + deb**
7. 通过 `softprops/action-gh-release` 将各平台安装包作为资产上传到同一个 Release
8. 签名/公证所需 Secrets 见 [第 5 节](#5-发布注意事项)；未配置时产出未签名安装包

本地模拟（不推 tag、不写仓库）需可访问 GitHub API 校验权限，请先导出 **Fine-grained 或 classic PAT**（具备 Contents、Metadata 等 Release 所需权限）：

```bash
export GH_TOKEN=ghp_xxxx   # 或 GITHUB_TOKEN
pnpm run release:dry-run
```

> 上述 `package` 矩阵已内置 macOS / Windows / Linux 三端打包与资产上传，无需再单独新增任务。

## 7. macOS「已损坏，无法打开」与分发

### 7.1 原因说明

从网络下载的 `.dmg` / `.app` 会带 **`com.apple.quarantine`** 扩展属性；同时 **未签名、未公证** 的 Electron 应用无法通过默认 Gatekeeper 策略，系统可能显示 **「已损坏，无法打开」**，这与二进制损坏无关。

### 7.2 用户侧临时处理

- 清除隔离：`xattr -cr "/Applications/WallpaperScreensaver.app"`（路径以实际为准）。
- 或在 Finder 中 **右键 → 打开**，首次选择「打开」。
- 或在 **隐私与安全性** 中使用「仍要打开」。

### 7.3 正式分发（推荐）

1. 加入 [Apple Developer Program](https://developer.apple.com/)。
2. 在钥匙串中安装 **Developer ID Application** 证书；CI 中使用 **导出为 .p12** 或 **Apple Distribution** 流程（勿将私钥提交进仓库，用 GitHub Encrypted secrets）。
3. 在 `apps/desktop/package.json` 的 `build.mac` 中配置 `identity`、`hardenedRuntime: true`，并按 [electron-builder 文档](https://www.electron.build/code-signing) 接入 **notarize**（如 `afterSign` + `notarytool`）。
4. 公证通过后，用户从网络下载的安装包一般可 **直接双击打开**，无需 `xattr`。

本地快速自检签名：`codesign -dv --verbose=4 "path/to/WallpaperScreensaver.app"`。
