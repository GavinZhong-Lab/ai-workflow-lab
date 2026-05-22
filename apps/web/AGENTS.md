# AGENTS.md — 前端开发规则

## 前端设计原则

- 避免 AI slop 审美 — 不使用 Inter/Roboto/Arial 等通用字体
- 使用独特配色方案 — 避免紫色渐变配白色背景的陈词滥调
- 优先使用 CSS 动画 — 入场动画、页面切换使用 Framer Motion
- 深色/亮色双主题 — 使用 CSS 变量实现主题切换
- 玻璃态卡片 — 使用 backdrop-filter 营造深度感

## 组件规范

- React 组件使用 `'use client'` 指令，服务端组件默认
- 每个页面必须有骨架屏加载状态（Suspense + skeleton fallback）
- 骨架屏布局必须镜像真实内容布局，避免 CLS
- 使用 animate-pulse + 柔和边框色，禁止闪烁/旋转动画
