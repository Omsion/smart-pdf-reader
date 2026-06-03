import { streamText } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAI } from "@ai-sdk/openai";

export async function POST(req: Request) {
  const { messages, contextMode, currentPage } = await req.json();

  // 构建上下文感知的系统提示
  const systemPrompt =
    contextMode === "current-page"
      ? `[系统信息：当前用户正在阅读第 ${currentPage} 页。请结合当前阅读进度回答用户的问题。]`
      : "[系统信息：用户正在阅读整个文档。请结合完整文档内容回答用户的问题。]";

  // 优先使用 DeepSeek，其次 OpenAI
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (deepseekKey) {
    const modelName = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
    const deepseek = createDeepSeek({
      apiKey: deepseekKey,
      baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
    });

    const result = streamText({
      model: deepseek(modelName),
      messages: [
        { role: "system" as const, content: systemPrompt },
        ...messages,
      ],
    });

    return result.toUIMessageStreamResponse();
  }

  if (openaiKey) {
    const openai = createOpenAI({ apiKey: openaiKey });

    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages: [
        { role: "system" as const, content: systemPrompt },
        ...messages,
      ],
    });

    return result.toUIMessageStreamResponse();
  }

  // 未配置任何 API Key
  return Response.json(
    {
      message:
        "未配置 AI API Key。请在项目根目录创建 .env.local 文件：\n\n" +
        "# DeepSeek（推荐）\n" +
        "DEEPSEEK_API_KEY=sk-your-deepseek-key\n" +
        "DEEPSEEK_MODEL=deepseek-chat\n\n" +
        "# 或 OpenAI\n" +
        "OPENAI_API_KEY=sk-your-openai-key\n\n" +
        "配置后重启 npm run dev 即可使用 AI 对话功能。",
    },
    { status: 500 },
  );
}
