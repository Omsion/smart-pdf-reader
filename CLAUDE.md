# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
npm install          # 安装依赖
npm run dev          # 启动开发服务器 (http://localhost:3000)
npm run build        # 生产构建
npm run lint         # ESLint (Next.js core-web-vitals + typescript)
```

## 技术架构

- **框架**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **样式**: Tailwind CSS 4 + shadcn/ui (`radix-nova` 风格, `components.json`)
- **状态管理**: Zustand 5 — 全局 store 在 `store/useAppStore.ts`
- **PDF 渲染**: `react-pdf` (pdf.js) — worker 从本地 `public/` 目录加载，禁用 SSR 动态导入 (`PdfViewerWrapper`)
- **AI SDK**: Vercel AI SDK v6
  - `@ai-sdk/deepseek` — DeepSeek 官方 provider，服务器降级方案
  - `@ai-sdk/openai` — OpenAI 官方 provider，用户自备 Key 时的动态连接器
  - `@ai-sdk/react` — `useChat` hook，用于 ChatPanel 前端对话交互
  - `ai` — `streamText()` / `generateText()` / `convertToModelMessages()`
- **Markdown 渲染**: `react-markdown` + `remark-gfm` + `remark-math` + `rehype-katex`（对话结果 & 划词弹窗共用，支持 LaTeX 数学公式渲染）

## 项目结构

```
app/
├── api/
│   ├── chat/route.ts       # 流式对话 — streamText() → toUIMessageStreamResponse()
│   └── action/route.ts     # 非流式 — generateText() 用于翻译/解释/总结
├── layout.tsx              # 根布局，body 设置 h-screen overflow-hidden
├── page.tsx                # 主页面：TopNavbar + PdfViewerWrapper + ChatPanel + FloatingToolbar
└── globals.css             # Tailwind v4 @import + shadcn CSS 变量 (oklch)
components/
├── PdfViewer.tsx           # react-pdf 核心渲染 + mouseup 提取选中文本
├── PdfViewerWrapper.tsx    # next/dynamic 包装，禁用 SSR（react-pdf 需要浏览器 API）
├── FloatingToolbar.tsx     # 划词悬浮菜单 + AI 结果弹窗（调用 /api/action，Markdown + LaTeX 渲染）
├── ChatPanel.tsx           # 右侧对话面板（useChat + 流式 Markdown + LaTeX 渲染）
├── TopNavbar.tsx           # 顶部导航：Logo + PDF 上传 + 缩放控制 + 设置按钮
├── SettingsDialog.tsx      # API 设置弹窗：Key / Base URL / 模型选择
└── ui/
    ├── dialog.tsx           # Radix Dialog 封装（shadcn 风格）
    └── resizable.tsx        # 可调整面板组件（基于 react-resizable-panels v4）
store/
└── useAppStore.ts          # Zustand: 运行时状态 + 用户配置（persist→localStorage）
lib/
└── utils.ts                # cn() = clsx + tailwind-merge + normalizeMathDelimiters() 公式格式归一化
public/
└── pdf.worker.min.mjs      # pdf.js worker（本地加载，无需 CDN）
start-reader.bat            # Windows 一键启动脚本
```

## 关键实现细节

### AI 层：动态 Provider + 降级机制

两个 API 路由采用"用户自备 Key 优先，服务器配置降级"的双轨策略：

**用户提供 Key 时** — 使用 `@ai-sdk/openai` 的 `createOpenAI()` 动态创建 provider，兼容所有 OpenAI 格式 API（DeepSeek、Moonshot、SiliconFlow 等）：
```ts
import { createOpenAI } from "@ai-sdk/openai";
const openai = createOpenAI({ apiKey: userApiKey, baseURL: userBaseUrl });
return openai.chat(selectedModel);
```

**用户未提供 Key 时** — 降级使用服务器环境变量的 DeepSeek provider：
```ts
import { createDeepSeek } from "@ai-sdk/deepseek";
const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL,
});
```

环境变量：`DEEPSEEK_API_KEY`（必填）、`DEEPSEEK_MODEL`（默认 `deepseek-v4-flash`）、`DEEPSEEK_BASE_URL`（可选代理地址）。

前端通过请求体将用户配置传给后端：`{ userApiKey, userBaseUrl, selectedModel }`。

`/api/chat` 使用 `streamText()` + `convertToModelMessages()` → `toUIMessageStreamResponse()`。

`/api/action` 使用 `generateText()` 返回纯文本 JSON，内置三种提示词模板（`translate` / `explain` / `summarize`）。

### PDF 文本选择流程

1. `PdfViewer` 在 `onMouseUp` 事件中通过 `window.getSelection()?.toString()` 提取选中文本
2. `setTimeout(0)` 延迟写入 Zustand `selectedText`，确保 selection 已生效
3. `FloatingToolbar` 监听 `selectedText` 变化，通过 `getBoundingClientRect()` 计算位置
4. 悬浮菜单用 `fixed` 定位 + `-translate-y-full` 显示在选中文字上方
5. 点击操作按钮 → `fetch("/api/action", ...)` → 结果弹窗显示在选中文字下方（支持 Markdown 渲染）

### ChatPanel 交互

- 使用 `@ai-sdk/react` 的 `useChat` hook + `DefaultChatTransport` 连接 `/api/chat`
- 自动上下文注入：通过 `body` 参数传递 `contextMode` 和 `currentPage`
- 选中 PDF 文本时自动填充到输入框（仅在输入框为空时触发）
- Enter 发送，Ctrl+Enter / Shift+Enter 换行
- AI 回复通过 `react-markdown` + `remark-gfm` + `remark-math` + `rehype-katex` 渲染，支持 LaTeX 数学公式
- 流式输出期间最后一条消息使用纯文本渲染（避免 KaTeX 每 token 重新解析影响性能），完成后切换为完整 Markdown 渲染

### LaTeX 公式渲染

AI 输出中的数学公式通过三层机制保证兼容性：

1. **前端归一化** — `normalizeMathDelimiters()` 将 AI 可能输出的非标准格式统一转换：
   - `\(...\)` / `\[...\]` → `$...$` / `$$...$$`
   - `\begin{env}...\end{env}` → `$$...$$` 包裹
   - 多行裸公式（含 `\frac`、`\sum` 等 LaTeX 命令但无 `$` 包裹的行）→ 自动检测并包裹为 `$$...$$`
   - 多行公式自动合并（连续含 LaTeX 命令的行视为同一公式块）

2. **KaTeX 容错** — `rehype-katex` 配置 `{ strict: false, throwOnError: false }`：
   - `strict: false` 允许非标准 LaTeX（如 `x^2_2` 歧义上下标）
   - `throwOnError: false` 解析失败时回退显示原始 LaTeX 源码而非崩溃

3. **System Prompt 约束** — `/api/chat` 注入 `MATH_FORMAT_RULES`，要求 AI：
   - 必须使用 `$` / `$$` 分隔符
   - 上下标用花括号显式限定（`a^{2}_{3}` 而非 `a^2_3`）
   - 范数使用 `\|x\|` 而非 `|x|`
   - 禁止 `\(...\)`、`\[...\]`、`\begin{equation}` 等格式

### react-pdf 注意事项

- pdf.js worker 从本地 `public/` 加载：`pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"`
- 必须渲染 `TextLayer`（`renderTextLayer={true}`）才能支持文本选择
- 导入 CSS：`react-pdf/dist/Page/TextLayer.css` 和 `AnnotationLayer.css`

### Zustand Store 设计

`setPdfFile` 会自动管理 Blob URL 生命周期 — 新文件上传时通过 `URL.revokeObjectURL()` 清理旧的 Object URL，避免内存泄漏。`selectedText` 为空字符串时，FloatingToolbar 组件返回 `null` 不渲染任何 DOM。

用户配置（`userApiKey`、`userBaseUrl`、`selectedModel`）通过 Zustand `persist` 中间件自动同步到 `localStorage`（key: `smart-pdf-reader-config`），仅序列化这三个字段（`partialize`），避免 File 对象等不可序列化的运行时状态导致异常。刷新页面后配置自动恢复。

### 用户配置流程

1. 顶部导航栏右侧齿轮图标 → 打开 `SettingsDialog`
2. 用户填入 API Key（`type=password` 掩码）、Base URL（支持 datalist 推荐）、模型名称（支持 datalist 推荐 + 自由输入）
3. 点击"保存"→ 写入 Zustand store → 自动持久化到 localStorage
4. ChatPanel 的 `useChat` body 函数和 FloatingToolbar 的 fetch 请求自动携带最新配置
5. 后端根据是否提供了 `userApiKey` 决定使用动态 OpenAI provider 还是服务器 DeepSeek 降级
