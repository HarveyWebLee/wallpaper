# 开发文档

## 1. 环境要求

- Node.js >= 20
- pnpm >= 10
- macOS / Windows

## 2. 安装依赖

```bash
pnpm install
```

## 3. 开发环境运行

```bash
pnpm run dev
```

该命令会并行启动：

- `apps/web`（默认 `http://127.0.0.1:5173`）
- `apps/server`（默认 `http://127.0.0.1:3000`）
- `apps/desktop`（Electron 窗口）

## 4. 常用命令

```bash
# 构建所有子项目
pnpm run build

# 仅构建前端
pnpm --filter @wallpaper/web build

# 仅构建后端
pnpm --filter @wallpaper/server build

# 仅构建桌面端主进程
pnpm --filter @wallpaper/desktop build
```

## 5. 代码规范命令

```bash
# 检查
pnpm run lint

# 自动修复
pnpm run lint:fix

# 全量格式化
pnpm run format

# 格式检查
pnpm run format:check
```

## 6. 提交前自动检查

项目使用 Husky + lint-staged。

- Git commit 前自动触发：
  - `eslint --fix`（针对暂存的 ts/tsx/js 文件）
  - `prettier --write`（针对暂存的样式、文档、配置类文件）

如果检查失败，提交会被拦截。

## 7. 桌面端：如何看到调试信息

应用支持环境变量 **`WALLPAPER_DEVTOOLS=1`**。开启后会在生产模式下：

- 自动打开 **Chromium DevTools**（Console / Network 等，与浏览器一致）；
- 在**启动应用的终端**里打印主进程信息：`index.html` / `preload` 的绝对路径、文件是否存在、`isPackaged` 等；
- 将渲染进程 **console** 输出转发到同一终端（便于无 DevTools 时抓日志）；
- 页面加载失败时会在终端输出 **`did-fail-load`** / **`did-fail-provisional-load`**。

**重要**：必须从 **终端**启动安装包里的可执行文件，终端里才会出现上述日志；在 Finder 里双击一般看不到。

### 7.1 已安装 `.app`（macOS）

```bash
WALLPAPER_DEVTOOLS=1 "/Applications/WallpaperScreensaver.app/Contents/MacOS/WallpaperScreensaver"
```

若可执行文件名或安装路径不同，请改为本机 `.app` 内 `Contents/MacOS/` 下的实际名称和路径。

可选：加上 Chromium 底层日志：

```bash
WALLPAPER_DEVTOOLS=1 "/Applications/WallpaperScreensaver.app/Contents/MacOS/WallpaperScreensaver" --enable-logging
```

### 7.2 本地未打包（模拟生产用 `file://` 打开前端）

先全量构建，再在桌面目录用 **`NODE_ENV=production`** 启动（否则 `electron-is-dev` 仍可能走开发服务器 URL）：

```bash
pnpm run build
cd apps/desktop
NODE_ENV=production WALLPAPER_DEVTOOLS=1 pnpm exec electron .
```

更完整的安装与排障说明见根目录 [README.md](../README.md) 及 [deployment.md](./deployment.md)。
