# 技术栈文档

## 1. 总体架构

本项目采用 Monorepo 结构，使用 `pnpm workspace` 管理多子应用。

- `apps/web`：前端渲染层
- `apps/server`：后端 API 服务
- `apps/desktop`：桌面端容器与系统能力接入

## 2. 前端技术栈（apps/web）

- React 19
- Ant Design 6 + @ant-design/icons
- dayjs
- Vite 6
- Less（大屏可视化布局、`flip-clock` 翻牌主题；`ConfigProvider` 暗色算法 + Design Token）
- TypeScript
- ESLint 9 + typescript-eslint
- Prettier 3

## 3. 后端技术栈（apps/server）

- NestJS 11
- TypeScript
- ESLint 9 + typescript-eslint
- Prettier 3

## 4. 桌面端技术栈（apps/desktop）

- Electron 35
- electron-builder
- koffi（Windows WorkerW / macOS 窗口层级 FFI）
- 本地 JSON 设置持久化（`userData/wallpaper-settings.json`）
- 系统托盘与 IPC（`contextBridge` + `ipcMain.handle`）
- TypeScript
- ESLint 9 + typescript-eslint
- Prettier 3

### 壁纸渲染

- 设置窗口：`index.html` → React 多页面应用
- 壁纸窗口：`wallpaper.html` → 独立轻量渲染入口（图片/视频/场景）
- 生产环境通过 `extraResources` 打包 `web/dist`

## 5. 工程化与质量体系

- Monorepo：`pnpm workspace`
- 并行开发：`concurrently`
- 代码规范：ESLint + Prettier
- 提交前校验：Husky + lint-staged
- 版本与发版：semantic-release（约定式提交驱动），GitHub Actions（`main` 推送后自动同步各包 `version`、`CHANGELOG`、构建 DMG 并创建 Release）

## 6. 打包产物

- macOS：`dmg`
- Windows：`nsis`
