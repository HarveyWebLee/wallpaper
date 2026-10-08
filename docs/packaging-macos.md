# macOS DMG 打包说明

本机若是 **Windows**，无法产出真实 `.dmg`。请用下列任一方式打包。

## 1. GitHub Actions（推荐）

推送可发布提交到 `main` 后，Release workflow 会在 `macos-latest` 上执行：

```bash
pnpm --filter @wallpaper/desktop exec electron-builder --mac --publish never
```

产物：`apps/desktop/release/*.dmg`，并上传到 GitHub Release。

- **无 Apple 证书**：`CSC_IDENTITY_AUTO_DISCOVERY=false`，`afterSign` 公证钩子在缺少 `APPLE_ID` / `APPLE_APP_SPECIFIC_PASSWORD` / `APPLE_TEAM_ID` 时**自动跳过**，仍会产出未签名/未公证 DMG。
- **有证书**：在仓库 Secrets 配置 `MAC_CSC_LINK`、`MAC_CSC_KEY_PASSWORD` 与上述 Apple 公证变量。

## 2. 本机 MacBook

在 macOS 上于仓库根目录：

```bash
pnpm install
pnpm run build
pnpm --filter @wallpaper/desktop exec electron-builder --mac --publish never
```

DMG 输出目录：`apps/desktop/release/`。

安装后若 Gatekeeper 提示「已损坏」，见根目录 README 的 `xattr -cr` 处理方式。
