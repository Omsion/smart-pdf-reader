import { streamText, convertToModelMessages } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL,
});

export async function POST(req: Request) {
  const json = await req.json();
  // AI SDK v6 的 DefaultChatTransport 将 body 嵌套发送
  const messages = json.messages;
  const documentText = json.documentText ?? json.body?.documentText;
  const currentPage = json.currentPage ?? json.body?.currentPage;

  let systemPrompt: string;

  if (documentText) {
    // 有文档全文：注入完整的学术助手 system prompt
    systemPrompt =
      "你是一个专业的学术论文阅读助手。以下是用户当前正在阅读的 PDF 文档全文内容：\n\n" +
      `${documentText}\n\n` +
      "请基于以上文档内容，专业、准确地回答用户的提问。回答时请尽量引用文档中的具体段落和数据。" +
      "如果文档中没有相关信息，请诚实说明「文档中未涉及此内容」，不要编造。\n\n" +
      "【重要】数学公式格式要求：行内公式必须用 $...$ 包围（如 $E=mc^2$），" +
      "块级公式必须用 $$...$$ 包围且独占一行。严禁使用 \\(...\\) 或 \\[...\\] 或直接裸写 LaTeX 命令。";
  } else if (currentPage) {
    systemPrompt = `[系统信息：当前用户正在阅读第 ${currentPage} 页。请结合当前阅读进度回答用户的问题。]\n\n【重要】数学公式格式要求：行内公式必须用 $...$ 包围，块级公式必须用 $$...$$ 包围。`;
  } else {
    systemPrompt = "你是一个专业的学术论文阅读助手。\n\n【重要】数学公式格式要求：行内公式必须用 $...$ 包围，块级公式必须用 $$...$$ 包围。";
  }

  if (!process.env.OPENAI_API_KEY && !process.env.DEEPSEEK_API_KEY) {
    return Response.json(
      {
        message:
          "未配置 API Key。请在 .env.local 中设置 OPENAI_API_KEY 或 DEEPSEEK_API_KEY。",
      },
      { status: 500 },
    );
  }

  const modelName = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

  // useChat 前端发来的是 UIMessage[]（含 parts 数组），需转为 streamText 可接受的 ModelMessage[]
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: deepseek.chat(modelName),
    system: systemPrompt,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
