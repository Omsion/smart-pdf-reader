# 智能 PDF 阅读器 (AI PDF Reader) - Vibe Coding 项目指南

## 1. 项目愿景 (Project Vision)
基于 Vibe Coding 理念打造的一款现代化、智能化的 PDF 阅读器。
目标：支持本地 PDF 渲染、文本高亮标注，并深度集成大语言模型（LLM），实现“划词一键翻译/解释”、“文档智能总结”与“基于文档内容的上下文对话”，让阅读外文文献、长篇报告更加高效自然。

## 2. 技术栈选型 (Tech Stack)
为了保证开发效率和代码现代化，严格限定 AI 使用以下技术栈：
*   **核心框架**: Next.js (App Router), React 18, TypeScript
*   **样式方案**: Tailwind CSS
*   **UI 组件库**: shadcn/ui (基于 Radix UI), Lucide React (图标)
*   **状态管理**: Zustand (用于跨组件共享 PDF 当前页码、选中文本、侧边栏状态等)
*   **PDF 渲染引擎**: `react-pdf` (基于 pdf.js，必须开启 TextLayer 以支持文本选择)
*   **AI 交互集成**: Vercel AI SDK (`ai` 和 `@ai-sdk/openai` 等核心包)
*   **Markdown 渲染**: `react-markdown` + `remark-gfm` (用于渲染右侧 AI 返回的结果)

## 3. UI 架构与布局 (UI Architecture & Layout)
参考主流双栏设计，采用 `Flexbox` 或 `CSS Grid` 实现 100vh 全屏无缝体验。

*   **顶部导航栏 (Top Navbar)**:
    *   左侧：Logo & 工具栏（重新加载、旋转、缩放比例、画笔高亮切换）。
    *   右侧：页面大纲模块(Pages)、问答模块(Q&A)切换 Tab，上传 PDF 按钮 (Upload PDF)，导出按钮 (Export)。
*   **左侧主视图 (PDF Viewer Region - 占据 60% 宽度)**:
    *   使用 `react-pdf` 渲染 PDF 页面。
    *   **划词弹出层 (Floating Toolbar)**: 用户选中文字后，悬浮出现“翻译”、“解释”、“总结”等快捷操作按钮。点击后可就地生成 Popover 弹窗展示 AI 结果（类似图片中的“知识蒸馏”解释框）。
*   **右侧边栏 (AI Chat Panel - 占据 40% 宽度)**:
    *   **上下文控制区**: 提供单选框（Radio Button），允许用户选择 AI 问答的上下文是“当前页 (Current Page)”还是“全文 (Whole Document)”。
    *   **对话列表区**: 展示用户提问与 AI 回答（支持 Markdown，如加粗、列表）。
    *   **输入区**: 底部固定输入框，支持多行输入与发送。

## 4. 核心功能与实现路径 (Core Features & Roadmap)

请 AI 严格按照以下 Phase (阶段) 逐步实现，不要一次性生成所有代码。

### Phase 1: 基础脚手架与布局 (Setup & Layout)
1.  初始化 Next.js + Tailwind + shadcn/ui。
2.  创建 Zustand Store (`useAppStore`)，定义全局状态：`pdfFile` (当前文件), `currentPage` (当前页码), `selectedText` (选中文本), `isSidebarOpen` (侧边栏状态)。
3.  完成“顶部栏”、“左侧区域”、“右侧区域”的基础 Flex 布局（先用占位色块代替）。

### Phase 2: PDF 本地渲染与文本选择 (PDF Rendering)
1.  集成 `react-pdf`。实现文件上传按钮，将文件流转为 Blob URL 喂给 PDF 渲染器。
2.  实现 PDF 的分页渲染、缩放功能。
3.  **核心难点**：必须渲染 `TextLayer`，使得 PDF 上的文字可以被鼠标原生拖拽选中。
4.  监听 `selectionchange` 或 `mouseup` 事件，获取用户选中的文本，并更新到 Zustand store 中。

### Phase 3: 划词高亮与悬浮菜单 (Text Selection & Floating Popover)
1.  当监听到 `selectedText` 不为空时，在鼠标松开的位置计算坐标（使用 `getBoundingClientRect`）。
2.  渲染一个绝对定位的悬浮菜单 (Floating Menu)，包含图标：🌎(翻译), 💡(解释), 📝(总结)。
3.  点击“翻译”时，调用 AI API，并利用 shadcn 的 `Popover` 或绝对定位的 Card 组件，在选中文字旁边展示带 loading 动画的翻译结果。

### Phase 4: 右侧智能对话集成 (AI Chat Integration)
1.  使用 Vercel AI SDK 的 `useChat` hook 搭建右侧聊天逻辑。
2.  实现“上下文感知”：如果用户勾选了“当前页”，在发送消息前，拦截请求，将 `react-pdf` 提取的当前页文本作为 System Prompt 或隐藏 Context 附加到请求中。
3.  右侧对话流渲染必须支持 Markdown 格式。

## 5. Vibe Coding 提示与系统设定 (System Rules for AI)

在编写代码时，AI 必须遵守以下原则：
1.  **模块化 (Modularity)**: 严禁将所有代码写在 `page.tsx` 中。必须拆分组件，例如 `PdfViewer.tsx`, `ChatPanel.tsx`, `FloatingToolbar.tsx`, `TopNavbar.tsx`。
2.  **优雅降级 (Mock First)**: 在实际对接 OpenAI API 之前，先写一个 Mock 函数模拟 AI 延迟返回数据，确保 UI 交互顺畅，再接入真实 API。
3.  **样式规范**: 统一使用 Tailwind utility classes，组件尽量复用 shadcn/ui。
4.  **PDF 坐标转换 (Crucial)**: 处理划词弹出层时，注意 PDF 缩放比例对 DOM 坐标的影响，弹出层尽量挂载在基于视口的固定层 (Portal) 或计算相对偏移。