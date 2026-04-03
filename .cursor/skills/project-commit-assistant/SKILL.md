---
name: project-commit-assistant
description: 生成符合 Angular 规范的中文 Git 提交信息，并在提交前执行 lint 与格式化检查。用于项目提交、代码合并前质量把关、规范化 commit message 场景。
---

# Project Commit Assistant

## 使用时机

- 用户要求生成提交信息
- 用户要求提交代码前做规范校验
- 用户要求检查 lint 与格式化状态

## 执行步骤

1. 先确认质量命令执行通过：
   - `pnpm run lint`
   - `pnpm run format:check`
   - `pnpm run typecheck`
2. 读取变更内容，归纳“为什么改”。
3. 生成中文 Angular 风格提交信息。

## 提交信息模板

```text
<type>(<scope>): <中文简述>

<中文正文，说明动机、核心改动与影响>
```

## 类型建议

- `feat`: 新功能
- `fix`: 缺陷修复
- `refactor`: 重构（无功能变化）
- `docs`: 文档变更
- `chore`: 维护类变更
- `build`: 构建与打包链路
- `ci`: 持续集成配置
- `test`: 测试相关
