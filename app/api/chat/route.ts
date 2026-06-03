import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

// DeepSeek API 兼容 OpenAI 格式
const deepseek = createOpenAI({
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY,
});

export async function POST(req: Request) {
  const { messages, contextMode, currentPage } = await req.json();

  // 构建上下文感知的系统提示
  const systemPrompt =
    contextMode === "current-page"
      ? `[系统信息：当前用户正在阅读第 ${currentPage} 页。请结合当前阅读进度回答用户的问题。]`
      : "[系统信息：用户正在阅读整个文档。请结合完整文档内容回答用户的问题。]";

  // 检查 API Key
  if (!process.env.OPENAI_API_KEY && !process.env.DEEPSEEK_API_KEY) {
    return Response.json(
      {
        message:
          "未配置 API Key。请在 .env.local 中设置 OPENAI_API_KEY 或 DEEPSEEK_API_KEY。",
      },
      { status: 500 },
    );
  }

  const result = streamText({
    model: deepseek("deepseek-v4-flash"),
    messages: [
      { role: "system" as const, content: systemPrompt },
      ...messages,
    ],
  });

  return result.toUIMessageStreamResponse();
}
