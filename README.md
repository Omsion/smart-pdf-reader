# Smart PDF Reader

基于 Next.js 构建的智能 PDF 阅读器 — 本地 PDF 渲染 + 划词 AI 解释 + 智能对话，让阅读外文文献更高效。

## 功能

- **PDF 渲染** — 基于 `react-pdf`（pdf.js），渐进式页面加载，支持缩放、连续滚动、文本选择
- **划词 AI** — 选中文字后弹出悬浮菜单，一键翻译 / 解释 / 总结，结果支持 Markdown + LaTeX 数学公式渲染
- **AI 对话** — 右侧边栏流式对话，Markdown + LaTeX（KaTeX）渲染，自动注入当前 PDF 全文上下文
- **用户自备 Key** — 网页端直接配置 API Key、Base URL 和模型，无需修改服务器配置文件，配置自动保存到浏览器
- **多模型支持** — 内置 12 款主流大模型，支持自定义输入任意模型名，兼容所有 OpenAI 格式 API
- **一键启动** — Windows 批处理脚本，双击即用，关闭即停

## 快速开始

### 方式一：一键启动（Windows 桌面用户）

双击 `start-reader.bat` → 浏览器自动打开 → 上传 PDF → 在设置中填入 API Key → 开始使用。

> 首次运行会自动安装依赖，约需 1-2 分钟。可将脚本创建桌面快捷方式（见下方教程）。

### 方式二：命令行

```bash
npm install          # 安装依赖
npm run dev          # 启动开发服务器
```

访问 http://localhost:3000。

## 桌面快捷方式（Windows）

1. 右键 `start-reader.bat` → **发送到** → **桌面快捷方式**
2. 右键桌面快捷方式 → **属性** → **快捷方式** 标签页
3. **运行方式** → 选择 **常规窗口**
4. 点击 **更改图标** → 输入 `C:\Windows\System32\imageres.dll` → 选择 PDF 图标 → 确定

## API 配置

项目支持两种 API 配置方式：

| 方式 | 说明 | 适用场景 |
|------|------|---------|
| **网页设置**（推荐） | 点击右上角齿轮图标，填入 Key / URL / 模型 | 分享给普通用户，无需接触代码 |
| **环境变量** | 在 `.env.local` 中配置 | 服务器部署，或作为降级兜底 |

### 在网页中配置

点击顶部导航栏右侧齿轮图标 → 填入：

1. **API Base URL** — 选择或输入 API 代理地址
2. **API Key** — 填入你的密钥（密码输入，支持切换显示）
3. **模型名称** — 从下拉列表选择，或选择"自定义"手动输入

配置自动保存到浏览器本地存储，刷新页面不丢失。留空 Key 则使用服务器的环境变量配置。

### 内置模型列表

| 模型 | 供应商 |
|------|--------|
| Kimi K2.5 / K2.6 | Moonshot (月之暗面) |
| MiMo-V2.5 / V2.5-Pro | 阶跃星辰 |
| MiniMax M2.5 / M2.7 / M3 | MiniMax |
| Qwen3.6 Plus / Qwen3.7 Plus / Qwen3.7 Max | 阿里云百炼 |
| DeepSeek V4 Pro / V4 Flash | DeepSeek |

支持选择「自定义」手动输入任意兼容 OpenAI 格式的模型名。

### 内置 API 地址

| 地址 | 供应商 |
|------|--------|
| `https://api.deepseek.com` | DeepSeek |
| `https://api.moonshot.cn/v1` | Moonshot (Kimi) |
| `https://api.stepfun.com/v1` | 阶跃星辰 (MiMo) |
| `https://api.minimax.chat/v1` | MiniMax |
| `https://dashscope.aliyuncs.com/compatible-mode/v1` | 阿里云百炼 (Qwen) |

也支持手动输入任意兼容 OpenAI 格式的代理地址。

### 环境变量（可选，降级兜底）

在根目录创建 `.env.local`：

```bash
DEEPSEEK_API_KEY=sk-your-key        # API Key（用户未设置时使用）
DEEPSEEK_MODEL=deepseek-v4-flash    # 默认模型
DEEPSEEK_BASE_URL=                  # 第三方代理地址（可选）
```

> 也支持 `OPENAI_API_KEY` 作为备用。当用户在网页中配置了自己的 Key 后，环境变量会被忽略。

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| 样式 | Tailwind CSS 4 + shadcn/ui (Radix Nova) |
| 状态管理 | Zustand 5 + 手动 localStorage 同步 |
| PDF 渲染 | react-pdf (pdf.js v4)，渐进式页面加载 + worker 本地部署 |
| AI SDK | Vercel AI SDK v6 — `@ai-sdk/deepseek` + `@ai-sdk/openai` + `@ai-sdk/react` |
| Markdown | react-markdown + remark-gfm + remark-math + rehype-katex |
| UI 组件 | @radix-ui/react-dialog + react-resizable-panels |

## 项目结构

```
├── app/
│   ├── api/
│   │   ├── chat/route.ts        # 流式对话 API（动态 Provider）
│   │   └── action/route.ts      # 划词操作 API（翻译/解释/总结）
│   ├── globals.css              # Tailwind v4 + shadcn 主题变量
│   ├── layout.tsx               # 根布局
│   └── page.tsx                 # 主页面
├── components/
│   ├── TopNavbar.tsx            # 顶部导航：Logo + PDF 上传 + 缩放 + 设置入口
│   ├── SettingsDialog.tsx       # API 设置弹窗：Key / Base URL / 模型选择
│   ├── PdfViewer.tsx            # PDF 渐进式渲染 + 文本提取 + 滚动跟踪
│   ├── PdfViewerWrapper.tsx     # 动态导入（禁用 SSR）
│   ├── FloatingToolbar.tsx      # 划词悬浮菜单 + AI 结果弹窗
│   ├── ChatPanel.tsx            # AI 对话面板（useChat + 流式 Markdown）
│   └── ui/
│       ├── dialog.tsx           # Radix Dialog 封装
│       └── resizable.tsx        # 可调整面板组件
├── store/
│   └── useAppStore.ts           # Zustand 全局状态 + 手动 localStorage
├── lib/
│   └── utils.ts                 # cn() + normalizeMathDelimiters() 公式归一化
├── public/
│   └── pdf.worker.min.mjs       # pdf.js worker
└── start-reader.bat             # Windows 一键启动脚本
```

## 架构说明

### AI 层：动态 Provider + 降级

后端采用双轨策略：

- **用户提供 Key** → 用 `@ai-sdk/openai` 的 `createOpenAI()` 动态连接，兼容所有 OpenAI 格式 API
- **用户未提供 Key** → 降级用服务器环境变量的 `@ai-sdk/deepseek`

前端通过请求体 `{ userApiKey, userBaseUrl, selectedModel }` 将配置传给后端。

### PDF 渲染：渐进式加载

上传 PDF 后，页面采用分批渲染策略避免主线程长时间阻塞：

1. 首屏只渲染前 3 页（约 300ms）
2. 每 150ms 释放一批（3 页），逐渐渲染剩余页面
3. 未渲染的页面用占位符撑开滚动高度
4. 约 1 秒内完成全部页面渲染，期间 UI 保持可交互

### PDF 文本提取：延迟 + 逐页释放

为避免与页面渲染争抢主线程：

1. 延迟 2 秒再启动文本提取（让渲染先行）
2. 逐页提取，每页之间释放主线程（30ms yield）
3. 进度遮罩显示实时页码，至少展示 1.5 秒

### 数学公式渲染：三层兼容

1. **前端归一化** — `normalizeMathDelimiters()` 将 AI 输出的非标准格式统一转为 `$` / `$$`
2. **KaTeX 容错** — `{ strict: false, throwOnError: false }` 解析失败不崩溃
3. **System Prompt 约束** — 要求 AI 使用标准分隔符和 KaTeX 兼容语法

## 许可证

BSD 3-Clause License
