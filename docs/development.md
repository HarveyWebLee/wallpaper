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
