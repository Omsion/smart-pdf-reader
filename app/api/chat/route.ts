import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  const { messages, contextMode, currentPage } = await req.json();

  // 构建上下文感知的系统提示
  const systemPrompt =
    contextMode === "current-page"
      ? `[系统信息：当前用户正在阅读第 ${currentPage} 页。请结合当前阅读进度回答用户的问题。]`
      : "[系统信息：用户正在阅读整个文档。请结合完整文档内容回答用户的问题。]";

  // 未配置 API Key 时返回友好提示
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      {
        message:
          "未配置 OPENAI_API_KEY。请在项目根目录创建 .env.local 文件并添加 OPENAI_API_KEY=sk-your-key-here，然后重启 dev server。",
      },
      { status: 500 },
    );
  }

  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages: [
      { role: "system" as const, content: systemPrompt },
      ...messages,
    ],
  });

  return result.toUIMessageStreamResponse();
}
