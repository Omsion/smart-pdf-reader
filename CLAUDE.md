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
- **状态管理**: Zustand 5 — 全局 store 在 `store/useAppStore.ts`，用户配置通过手动 `localStorage` 同步（非 persist 中间件，避免 SSR 水合竞态）
- **PDF 渲染**: `react-pdf` (pdf.js v4) — worker 从本地 `public/` 目录加载，SSR 禁用动态导入 (`PdfViewerWrapper`)，**渐进式页面渲染**（初始 3 页，每 150ms 释放 3 页）
- **PDF 文本提取**: pdf.js 直接 API，**延迟 2s 启动 + 逐页 yield（30ms）+ 最小展示 1.5s**，进度遮罩分两阶段显示
- **AI SDK**: Vercel AI SDK v6
  - `@ai-sdk/deepseek` — DeepSeek 官方 provider，服务器降级方案
  - `@ai-sdk/openai` — OpenAI 官方 provider，用户自备 Key 时的动态连接器（兼容所有 OpenAI 格式 API）
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
├── PdfViewer.tsx           # PDF 渐进式渲染（分批加载页）+ 滚文检测 + 延迟文本提取（两阶段进度遮罩）
├── PdfViewerWrapper.tsx    # next/dynamic 包装，禁用 SSR（react-pdf 需要浏览器 API）
├── FloatingToolbar.tsx     # 划词悬浮菜单 + AI 结果弹窗（调用 /api/action，Markdown + LaTeX 渲染）
├── ChatPanel.tsx           # 右侧对话面板（useChat + 流式 Markdown + LaTeX 渲染，流式末条纯文本）
├── TopNavbar.tsx           # 顶部导航：Logo + PDF 上传 + 缩放控制 + 设置按钮
├── SettingsDialog.tsx      # API 设置弹窗：Base URL → Key → 模型下拉选择 + 自定义输入
└── ui/
    ├── dialog.tsx           # Radix Dialog 封装（shadcn 风格，含 Overlay + Content + Header + Footer）
    └── resizable.tsx        # 可调整面板组件（基于 react-resizable-panels v4）
store/
└── useAppStore.ts          # Zustand: 运行时状态 + 用户配置（手动 localStorage 读写，无 SSR 竞态）
lib/
└── utils.ts                # cn() = clsx + tailwind-merge + normalizeMathDelimiters() 公式格式归一化
public/
└── pdf.worker.min.mjs      # pdf.js worker（本地加载，无需 CDN）
start-reader.bat            # Windows 一键启动脚本（端口检测 + 自动安装依赖 + 按键停止）
```

## 关键实现细节

### AI 层：动态 Provider + 降级机制

两个 API 路由采用"用户自备 Key 优先，服务器配置降级"的双轨策略：

**用户提供 Key 时** — 使用 `@ai-sdk/openai` 的 `createOpenAI()` 动态创建 provider，兼容所有 OpenAI 格式 API（DeepSeek、Kimi、Qwen、MiniMax 等）：
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

环境变量：`DEEPSEEK_API_KEY`（可选）、`DEEPSEEK_MODEL`（默认 `deepseek-v4-flash`）、`DEEPSEEK_BASE_URL`（可选代理地址）。

DeepSeek V4 Flash 思考模式默认启用（`thinking: enabled`, `reasoning_effort: high`），无需额外配置。

前端通过请求体将用户配置传给后端：`{ userApiKey, userBaseUrl, selectedModel }`。

### PDF 渐进式渲染

上传 PDF 后，页面分批渲染以避免一次性渲染所有页面导致的主线程长时间阻塞：

1. `loadedPages` 状态初始值为 3（`BATCH_SIZE`）
2. 前 3 页立即渲染，其余页面用占位符 `<div>` 撑开滚动高度
3. 占位符高度由第一页加载后的真实尺寸校正（`onLoadSuccess` → `getViewport({ scale: 1 })`）
4. `useEffect` 每 150ms 调用 `setLoadedPages(prev => prev + 3)`，逐步将占位符替换为真实 `Page` 组件
5. 约 1 秒内完成全部页面渲染，期间 UI 完全可交互

关键常量：`BATCH_SIZE = 3`，`ESTIMATED_PAGE_HEIGHT = 920`。

### PDF 文本提取：两阶段进度遮罩

`PdfViewer.tsx` 内 `useEffect` 监听 `pdfUrl` 变化，自动提取全文：

1. **阶段 1（准备）** — `isExtracting && total === 0`：立即显示遮罩"正在准备 PDF 解析..."，等待 2000ms 让渐进渲染先行
2. **阶段 2（提取）** — `isExtracting && total > 0`：逐页提取 + 进度条 + 页码计数，每页间 `setTimeout(30)` yield
3. **最小展示** — 阶段 2 至少显示 1500ms，即使 pdf.js 缓存让提取极快也不闪
4. **取消安全** — `cancelled` 标志 + cleanup 函数，切换 PDF 时丢弃旧提取结果

文本存入 `documentText`，ChatPanel 通过 `useChat` 的 `body` 函数动态注入。

### PDF 文本选择流程

1. `PdfViewer` 在 `onMouseUp` 事件中通过 `window.getSelection()?.toString()` 提取选中文本
2. `setTimeout(0)` 延迟写入 Zustand `selectedText`，确保 selection 已生效
3. `FloatingToolbar` 监听 `selectedText` 变化，通过 `getBoundingClientRect()` 计算位置
4. 悬浮菜单用 `fixed` 定位 + `-translate-y-full` 显示在选中文字上方
5. 点击操作按钮 → `fetch("/api/action", ...)` → 结果弹窗显示在选中文字下方（Markdown + LaTeX 渲染）
6. 结果弹窗通过 `clampPosition()` 确保不出视口边界

### ChatPanel 交互

- 使用 `@ai-sdk/react` 的 `useChat` hook + `DefaultChatTransport` 连接 `/api/chat`
- 自动上下文注入：通过 `body` 函数传递 `documentText`、`currentPage`、`userApiKey`、`userBaseUrl`、`selectedModel`
- 选中 PDF 文本时自动填充到输入框（仅在输入框为空时触发）
- Enter 发送，Ctrl+Enter / Shift+Enter 换行
- AI 回复通过 `react-markdown` + `remark-gfm` + `remark-math` + `rehype-katex` 渲染
- 流式输出期间最后一条消息使用纯文本渲染（避免 KaTeX 每 token 重新解析影响性能），完成后切换为完整 Markdown 渲染
- 已完成消息使用 `memo` 避免父组件重渲染时重复执行

### LaTeX 公式渲染

AI 输出中的数学公式通过三层机制保证兼容性：

1. **前端归一化** — `normalizeMathDelimiters()` 将 AI 可能输出的非标准格式统一转换：
   - `\(...\)` / `\[...\]` → `$...$` / `$$...$$`
   - `\begin{env}...\end{env}` → `$$...$$` 包裹
   - 多行裸公式（含 `\frac`、`\sum` 等 LaTeX 命令但无 `$` 包裹的行）→ 自动检测并包裹为 `$$...$$`
   - 多行公式自动合并（连续含 LaTeX 命令的行视为同一公式块）
   - 使用占位符保护已有标准格式，避免重复处理

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
- `Document` 组件设置固定 `width={700}` + `scale` 动态缩放
- 第一页 `onLoadSuccess` 用于获取真实页面尺寸，校准占位符高度

### Zustand Store 设计

- `setPdfFile` 自动管理 Blob URL 生命周期 — 上传新文件时通过 `URL.revokeObjectURL()` 清理旧 URL
- `selectedText` 为空字符串时，FloatingToolbar 返回 `null` 不渲染 DOM
- 用户配置通过**手动 `localStorage` 读写**（非 persist 中间件）：
  - `loadConfig()` — 模块加载时同步读取，`typeof window` 守卫 SSR 安全
  - `saveConfig()` — 每次 setter 调用时间写入，`try/catch` 静默降级
  - 避免了 Zustand persist 中间件在 Next.js SSR 环境下的水合竞态问题

### 用户配置流程

1. 顶部导航栏右侧齿轮图标 → 打开 `SettingsDialog`
2. **API Base URL**（首位）：`<input>` + `<datalist>` 推荐常用地址，可自由输入
3. **API Key**：`type=password`（可切换显示），留空则使用服务器环境变量
4. **模型名称**：`<select>` 下拉框显示 12 款常用模型 + 「✏️ 自定义模型...」选项（选中后展开文本框）
5. 点击"保存"→ 写入 Zustand store → `saveConfig()` 同步到 localStorage
6. ChatPanel 的 `useChat` body 函数和 FloatingToolbar 的 fetch 请求自动携带最新配置
7. 后端根据 `userApiKey` 是否为空决定使用动态 OpenAI provider 还是服务器 DeepSeek 降级

### start-reader.bat 设计

- 纯 ASCII 编码，兼容所有 Windows 中文环境
- `where npm` 检测 Node.js 环境
- 首次运行自动 `npm install`
- `netstat` 检测 3000 端口是否已占用
- `start /D "%~dp0"` 在项目目录启动服务器（关键：`/D` 指定工作目录）
- 轮询端口 15 秒，超时降级直接打开浏览器
- `pause` 等待用户按键，然后 `taskkill` 精准停止占用 3000 端口的进程
