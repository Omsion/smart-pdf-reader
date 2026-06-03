import { streamText, convertToModelMessages } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL,
});

export async function POST(req: Request) {
  const { messages, contextMode, currentPage } = await req.json();

  const systemPrompt =
    contextMode === "current-page"
      ? `[系统信息：当前用户正在阅读第 ${currentPage} 页。请结合当前阅读进度回答用户的问题。]`
      : "[系统信息：用户正在阅读整个文档。请结合完整文档内容回答用户的问题。]";

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
  const modelMessages = convertToModelMessages(messages);

  const result = streamText({
    model: deepseek.chat(modelName),
    system: systemPrompt,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
