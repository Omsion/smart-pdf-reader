import { streamText, convertToModelMessages } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAI } from "@ai-sdk/openai";

// 服务器端默认 DeepSeek provider（用户未提供 Key 时的降级方案）
const serverDeepSeek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL,
});

/**
 * 动态创建模型实例：
 * - 如果用户提供了 API Key，则用 createOpenAI 连接任意兼容 OpenAI 格式的 API
 * - 否则降级使用服务器的 DeepSeek 环境变量配置
 */
function getModel(userApiKey: string, userBaseUrl: string, selectedModel: string) {
  if (userApiKey) {
    const openai = createOpenAI({
      apiKey: userApiKey,
      baseURL: userBaseUrl || "https://api.openai.com/v1",
    });
    return openai.chat(selectedModel || "gpt-4o-mini");
  }

  // 降级：使用服务器环境变量
  const modelName = selectedModel || process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
  return serverDeepSeek.chat(modelName);
}

export async function POST(req: Request) {
  const json = await req.json();
  // AI SDK v6 的 DefaultChatTransport 将 body 嵌套发送
  const messages = json.messages;
  const documentText = json.documentText ?? json.body?.documentText;
  const currentPage = json.currentPage ?? json.body?.currentPage;

  // 用户配置（可能来自 body 顶层或嵌套）
  const userApiKey = json.userApiKey ?? json.body?.userApiKey ?? "";
  const userBaseUrl = json.userBaseUrl ?? json.body?.userBaseUrl ?? "";
  const selectedModel = json.selectedModel ?? json.body?.selectedModel ?? "";

  let systemPrompt: string;

  // 数学公式格式约束：注入到所有 system prompt，确保 AI 使用标准 $/$$ 分隔符
  const MATH_FORMAT_RULES =
    "\n\n━━━━━━ 数学公式格式规定（必须严格遵守）━━━━━━\n" +
    "1. 任何数学公式都必须用 $ 或 $$ 包围，严禁裸写 LaTeX 命令。\n" +
    "2. 行内公式：用单个 $...$ 包围，如 $E=mc^2$、$\\mathcal{S}_{++}^n$\n" +
    "3. 块级公式：用 $$...$$ 独占一行包围，如：\n" +
    "   $$\n" +
    "   a_{ij} = \\exp\\left(-\\frac{\\|\\text{loc}_{v_i}-\\text{loc}_{v_j}\\|^2}{2\\sigma^2}\\right)\n" +
    "   $$\n" +
    "4. 严禁使用的格式：\\(...\\)、\\[...\\]、\\begin{equation}...\\end{equation}。\n" +
    "5. KaTeX 兼容规则（重要，违者公式可能无法渲染）：\n" +
    "   - 上下标必须用花括号显式限定范围：写 a^{2}_{3}，严禁写 a^2_3。\n" +
    "   - 范数/模长使用 \\| 而非 |：写 \\|x\\|，严禁写 |x|。\n" +
    "   - \\text{} 内避免嵌套复杂公式，简单文字用 \\mathrm{}。\n" +
    "   - 矩阵/对齐必须放在 $$...$$ 内，使用 \\begin{pmatrix}/\\begin{aligned} 等。\n" +
    "   - 公式保持在同一行（不要换行拆分），除非是 matrix/aligned 等环境内部。\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

  if (documentText) {
    systemPrompt =
      "你是一个专业的学术论文阅读助手。以下是用户当前正在阅读的 PDF 文档全文内容：\n\n" +
      `${documentText}\n\n` +
      "请基于以上文档内容，专业、准确地回答用户的提问。回答时请尽量引用文档中的具体段落和数据。" +
      "如果文档中没有相关信息，请诚实说明「文档中未涉及此内容」，不要编造。" +
      MATH_FORMAT_RULES;
  } else if (currentPage) {
    systemPrompt = `[系统信息：当前用户正在阅读第 ${currentPage} 页。请结合当前阅读进度回答用户的问题。]${MATH_FORMAT_RULES}`;
  } else {
    systemPrompt = `你是一个专业的学术论文阅读助手。${MATH_FORMAT_RULES}`;
  }

  // 检查是否有任何可用的 API Key（用户提供或服务器配置）
  if (!userApiKey && !process.env.OPENAI_API_KEY && !process.env.DEEPSEEK_API_KEY) {
    return Response.json(
      {
        message:
          "未配置 API Key。请在设置中填入您的 API Key，或在服务器 .env.local 中设置 OPENAI_API_KEY 或 DEEPSEEK_API_KEY。",
      },
      { status: 500 },
    );
  }

  const model = getModel(userApiKey, userBaseUrl, selectedModel);

  // useChat 前端发来的是 UIMessage[]（含 parts 数组），需转为 streamText 可接受的 ModelMessage[]
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model,
    system: systemPrompt,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
