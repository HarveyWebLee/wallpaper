# Wallpaper Screensaver

基于 Electron + NestJS + React 的桌面端屏保项目。当前版本已实现出生日期输入、退休日期实时计算、倒计时展示、趣味动画效果。

## 项目结构

```text
wallpaper/
├── apps/
│   ├── desktop/   # Electron 主进程
│   ├── server/    # NestJS 后端服务
│   └── web/       # React 前端界面
├── docs/          # 项目文档
└── package.json   # Monorepo 根配置
```

## 快速开始

1. 安装依赖

```bash
pnpm install
```

2. 启动开发环境（前端 + 后端 + 桌面端）

```bash
pnpm run dev
```

3. 构建项目

```bash
pnpm run build
```

4. 打包桌面安装包（mac/win）

```bash
pnpm run package:desktop
```

## macOS：安装后提示「已损坏，无法打开」

当前 CI/本地打出的 **未使用 Apple Developer ID 签名与公证** 的安装包，常被 **门禁（Gatekeeper）** 拦截，系统中文提示容易让人误以为 App 真坏了，多数是 **隔离属性（quarantine）** 或 **未信任开发者**。

**处理方式（任选其一）**

1. **除掉隔离标记**（从浏览器/GitHub Release 下载后最常见），在终端执行（按你实际安装路径改）：

   ```bash
   xattr -cr "/Applications/WallpaperScreensaver.app"
   ```

   若尚未拖进「应用程序」，可先对 **挂载出来的 `.app`** 执行同样命令，再拖入。

2. **首次强制打开**：在 Finder 里对 `WallpaperScreensaver.app` **右键 → 打开 → 打开**（不要只双击）。

3. **系统设置**：尝试打开一次后，打开 **系统设置 → 隐私与安全性**，对提示选择 **仍要打开**（具体文案随 macOS 版本略有不同）。

**长期方案**：使用 **Apple Developer Program** 做 **Developer ID Application** 签名 + **Notarization（公证）**，并在 `electron-builder` 中配置证书与公证（见 [运维部署文档](./docs/deployment.md) 第 7 节）。

## 调试打包版桌面端（白屏、资源未加载等）

1. **从终端启动**（才能把日志打在你看的见的终端里），并打开与开发环境类似的 **Chromium DevTools**：

   ```bash
   WALLPAPER_DEVTOOLS=1 "/Applications/WallpaperScreensaver.app/Contents/MacOS/WallpaperScreensaver"
   ```

   - **Console / Network** 里可看 JS 报错、资源是否 404（`file://` 下尤其要看路径）。
   - 终端里会出现主进程打印的 `index.html` / `preload` 路径及 **是否存在**（`exists: true/false`），以及可选的 `[renderer]` 控制台转发。

2. **未打包、仅本地构建**（用 `file://` 打开 `apps/web/dist`，行为接近安装包）：

   ```bash
   pnpm run build
   cd apps/desktop
   NODE_ENV=production WALLPAPER_DEVTOOLS=1 pnpm exec electron .
   ```

   `electron-is-dev` 在未打包时若不设 `NODE_ENV=production` 会仍走开发服务器地址；上面命令强制走生产加载逻辑。

3. **Chromium 底层日志**（可选）：

   ```bash
   WALLPAPER_DEVTOOLS=1 "/Applications/WallpaperScreensaver.app/Contents/MacOS/WallpaperScreensaver" --enable-logging
   ```

可执行文件名须与 `.app` 内 `Contents/MacOS/` 下一致；若改过 `productName`，请替换路径。

## 自动发版（main 分支）

推送到 GitHub **`main`** 且存在可发布提交（例如 `feat:`、`fix:`、`perf:`）时，CI 会运行 **semantic-release**：统一提升各包 `version`、更新 `CHANGELOG.md`、构建 DMG 并创建 [GitHub Release](https://github.com/HarveyWebLee/wallpaper/releases)。  
提交信息需符合仓库约定（Angular 风格：`type(scope): 中文说明`）。本地预演：`pnpm run release:dry-run`。详见 [运维部署文档](./docs/deployment.md#6-自动化版本与-github-release)。

## 质量保障

- 代码检查：`pnpm run lint`
- 自动修复：`pnpm run lint:fix`
- 格式化：`pnpm run format`
- 格式检查：`pnpm run format:check`

提交前会自动执行 `lint-staged`，对暂存文件做 `eslint --fix` 和 `prettier --write`。

## 文档导航

- [功能需求文档](./docs/requirements.md)
- [技术栈文档](./docs/tech-stack.md)
- [开发文档](./docs/development.md)
- [运维部署文档](./docs/deployment.md)
