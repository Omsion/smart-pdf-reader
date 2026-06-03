import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const deepseek = createOpenAI({
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY,
  compatibility: "compatible",
});

const PROMPTS: Record<string, string> = {
  translate: "请将以下内容翻译为流畅的中文。只返回翻译结果，不要添加任何解释或额外内容。",
  explain: "请用通俗易懂的语言解释以下内容的含义。如果涉及专业术语，请一并说明。",
  summarize: "请用简洁的语言总结以下内容的核心要点，分条列出关键信息。",
};

export async function POST(req: Request) {
  const { text, action } = (await req.json()) as {
    text: string;
    action: string;
  };

  if (!text?.trim()) {
    return Response.json({ error: "文本内容不能为空" }, { status: 400 });
  }

  const systemPrompt = PROMPTS[action];
  if (!systemPrompt) {
    return Response.json(
      { error: `不支持的操作类型: ${action}` },
      { status: 400 },
    );
  }

  if (!process.env.OPENAI_API_KEY && !process.env.DEEPSEEK_API_KEY) {
    return Response.json(
      { error: "未配置 API Key" },
      { status: 500 },
    );
  }

  try {
    const modelName = process.env.DEEPSEEK_MODEL || "deepseek-chat";

    const result = await generateText({
      model: deepseek(modelName),
      system: systemPrompt,
      prompt: text,
    });

    return Response.json({ result: result.text });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "请求失败，请检查 API Key 和网络连接";
    return Response.json({ error: message }, { status: 500 });
  }
}
