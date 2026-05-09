# 登录/注册页隐藏左侧菜单

## 概述

当前 `layout.tsx` 中的 `CRMLayout` 包裹了所有页面，导致 `/login` 和 `/register` 页面也显示了 CRM 的左侧菜单栏和顶部 Header。本计划修复此问题，使登录/注册页只显示表单内容，无侧边栏干扰。

## 技术方案

| 维度 | 选择 | 理由 |
|------|------|------|
| 实现方式 | 路径判断条件渲染 | 在 `CRMLayout` 中用 `usePathname` 检测当前路径，若为 `/login` 或 `/register`，则隐藏 Sidebar/Header，仅渲染居中的 children |
| 涉及的组件 | `CRMLayout` | 单一组件修改，侵入性最小，无需改动路由结构或创建新布局组 |
| 依赖 | `next/navigation` 的 `usePathname` | Next.js App Router 标准 API，已在项目中广泛使用 |

## 功能模块

- **路径白名单**：`/login`、`/register` 为无菜单页面
- **条件渲染**：白名单页面只渲染 `children`（居中全屏），其他页面保持现有 Sidebar + Header 布局
- **样式处理**：登录/注册页使用 `min-h-screen flex items-center justify-center` 居中表单

## 是否有原型设计

否。本次为纯布局逻辑修复，不涉及新的 UI 设计或页面结构变更。

## 实施步骤

1. **修改 `CRMLayout` 组件** — 添加 `usePathname` 判断，在 `/login` 和 `/register` 路径下隐藏 `Sidebar`、`Header`、`MobileHeader`，仅渲染居中的 `children`。
   - `src/components/crm/layout.tsx`

2. **验证构建与 lint** — 运行 `pnpm lint` 和 `pnpm ts-check` 确保无类型/语法错误，确认 `/login`、`/register` 及其他页面访问正常。
