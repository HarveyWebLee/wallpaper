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
