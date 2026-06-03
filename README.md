# Smart PDF Reader

基于 Next.js 构建的智能 PDF 阅读器 — 本地 PDF 渲染 + 划词 AI 解释 + 智能对话，让阅读外文文献更高效。

## 功能

- **PDF 渲染** — 基于 `react-pdf`（pdf.js），支持分页、缩放、文本选择
- **划词 AI** — 选中文字后弹出悬浮菜单，一键翻译 / 解释 / 总结，结果支持 Markdown 渲染
- **AI 对话** — 右侧边栏实时对话，流式输出 + Markdown 渲染，选中文本自动填入输入框
- **上下文感知** — 自动注入当前页码或全文上下文到 AI 对话中

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| 样式 | Tailwind CSS 4 + shadcn/ui (Radix Nova) |
| 状态管理 | Zustand 5 |
| PDF 渲染 | react-pdf (pdf.js)，worker 本地加载 |
| AI SDK | Vercel AI SDK v6 — `@ai-sdk/deepseek` + `@ai-sdk/react` |
| Markdown | react-markdown + remark-gfm |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000，上传 PDF 即可使用。

## 环境变量

在根目录创建 `.env.local`：

```bash
# DeepSeek API Key（必填）
DEEPSEEK_API_KEY=sk-your-key

# 可选配置
DEEPSEEK_MODEL=deepseek-v4-flash    # 默认模型
DEEPSEEK_BASE_URL=                  # 第三方代理地址（可选）
```

> 也支持 OpenAI API Key：设置 `OPENAI_API_KEY` 作为 fallback。

## 项目结构

```
├── app/
│   ├── api/
│   │   ├── chat/route.ts      # 流式对话 API
│   │   └── action/route.ts    # 划词操作 API（翻译/解释/总结）
│   ├── globals.css            # Tailwind + shadcn 主题变量
│   ├── layout.tsx             # 根布局
│   └── page.tsx               # 主页面
├── components/
│   ├── TopNavbar.tsx          # 顶部导航 + PDF 上传
│   ├── PdfViewer.tsx          # PDF 渲染 + 文本选择
│   ├── PdfViewerWrapper.tsx   # 动态导入（禁用 SSR）
│   ├── FloatingToolbar.tsx    # 划词悬浮菜单 + AI 弹窗
│   ├── ChatPanel.tsx          # AI 对话面板（useChat + Markdown）
│   └── ui/                    # shadcn/ui 组件
├── store/
│   └── useAppStore.ts         # Zustand 全局状态
├── lib/
│   └── utils.ts               # 工具函数
└── public/
    └── pdf.worker.min.mjs     # pdf.js worker
```

## 许可证

BSD 3-Clause License
