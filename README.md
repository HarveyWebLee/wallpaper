# Wallpaper 动态壁纸

跨平台（Windows / macOS）动态壁纸桌面应用。支持图片、视频与内置动态场景，将内容渲染在桌面图标层之下；提供托盘快捷控制与现代化设置界面。

## 核心能力

- **桌面层壁纸**：Windows 使用 WorkerW 注入，macOS 使用桌面层窗口级别
- **壁纸库**：导入本地图片（JPG/PNG/WebP/GIF）与视频（MP4/WebM/MOV）
- **内置场景**：退休倒计时翻牌、极光渐变、粒子星空
- **多显示器**：按显示器自动创建壁纸窗口
- **托盘控制**：暂停/恢复、重新应用、打开设置
- **偏好设置**：开机启动、启动时应用壁纸、性能模式、视频音量等
- **设置持久化**：用户配置写入本地 JSON，重启后保留

## 项目结构

```text
wallpaper/
├── apps/
│   ├── desktop/   # Electron 主进程（壁纸层、托盘、IPC）
│   ├── server/    # NestJS 后端（健康检查，可扩展）
│   └── web/       # React 设置界面 + 壁纸渲染页
├── docs/
└── package.json
```

## 快速开始

```bash
pnpm install
pnpm run dev          # 前端 + 后端 + 桌面端
pnpm run build        # 构建全部
pnpm run package:desktop  # 打包安装包（DMG / NSIS）
```

## 使用说明

1. 启动后打开**控制中心**，点击「应用壁纸」将当前壁纸铺到桌面
2. 在**壁纸库**中导入本地图片或视频，一键应用
3. 在**内置场景**中配置退休倒计时并应用为壁纸
4. 在**偏好设置**中配置开机启动、性能与音量
5. 关闭设置窗口后应用仍在托盘运行；右键托盘可暂停或退出

## macOS：安装后提示「已损坏」

未签名安装包可能被 Gatekeeper 拦截，可执行：

```bash
xattr -cr "/Applications/WallpaperScreensaver.app"
```

长期方案见 [运维部署文档](./docs/deployment.md)。

## 质量保障

```bash
pnpm run lint
pnpm run typecheck
pnpm run format:check
```

## 文档

- [功能需求](./docs/requirements.md)
- [技术栈](./docs/tech-stack.md)
- [开发指南](./docs/development.md)
- [部署发版](./docs/deployment.md)
