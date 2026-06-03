# Smart PDF Reader

基于 Next.js 构建的智能 PDF 阅读器，支持 PDF 本地渲染、划词标注与 AI 上下文对话。

## 功能

- **PDF 渲染** — 基于 `react-pdf`（pdf.js），支持分页、缩放、文本选择
- **划词悬浮菜单** — 选中文字后弹出快捷操作栏（翻译 / 解释 / 总结）
- **AI 对话** — 右侧边栏集成 AI 问答，支持 Markdown 流式渲染
- **上下文感知** — 可切换「当前页」或「整个文档」作为 AI 对话上下文

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) + React 19 + TypeScript |
| 样式 | Tailwind CSS 4 + shadcn/ui (Radix + Nova) |
| 状态管理 | Zustand |
| PDF 渲染 | react-pdf (pdf.js) |
| AI 对话 | Vercel AI SDK v6 + DeepSeek / OpenAI |
| Markdown | react-markdown + remark-gfm |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 环境变量

在根目录创建 `.env.local`：

```bash
# DeepSeek（推荐）
DEEPSEEK_API_KEY=sk-your-key
DEEPSEEK_MODEL=deepseek-chat

# 或 OpenAI
OPENAI_API_KEY=sk-your-key
```

支持通过 `DEEPSEEK_BASE_URL` 指定第三方代理地址。

## 项目结构

```
├── app/
│   ├── api/chat/route.ts    # AI 对话 API（DeepSeek / OpenAI）
│   ├── globals.css           # Tailwind + shadcn 主题变量
│   ├── layout.tsx            # 根布局
│   └── page.tsx              # 主页面（三区块 Flex 布局）
├── components/
│   ├── TopNavbar.tsx         # 顶部导航栏 + PDF 上传
│   ├── PdfViewer.tsx         # PDF 渲染 + 文本选择
│   ├── PdfViewerWrapper.tsx  # 动态导入（禁用 SSR）
│   ├── FloatingToolbar.tsx   # 划词悬浮菜单 + Mock 结果
│   ├── ChatPanel.tsx         # AI 对话面板
│   └── ui/                   # shadcn/ui 组件
├── store/
│   └── useAppStore.ts        # Zustand 全局状态
├── lib/
│   └── utils.ts              # 工具函数
└── public/                   # 静态资源
```

## 许可证

BSD 3-Clause License
