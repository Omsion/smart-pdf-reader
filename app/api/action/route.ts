import { generateText } from "ai";
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

const MATH_FORMAT_NOTE =
  "注意：回答中涉及数学公式时，行内公式必须使用 $...$ 包围，块级公式必须使用 $$...$$ 包围。（严禁使用 \\( \\) 或 \\[ \\] 或直接裸写 LaTeX 命令）";

const PROMPTS: Record<string, string> = {
  translate: `请将以下内容翻译为流畅的中文。只返回翻译结果，不要添加任何解释或额外内容。${MATH_FORMAT_NOTE}`,
  explain: `请用通俗易懂的语言解释以下内容的含义。如果涉及专业术语，请一并说明。${MATH_FORMAT_NOTE}`,
  summarize: `请用简洁的语言总结以下内容的核心要点，分条列出关键信息。${MATH_FORMAT_NOTE}`,
};

export async function POST(req: Request) {
  const { text, action, userApiKey, userBaseUrl, selectedModel } =
    (await req.json()) as {
      text: string;
      action: string;
      userApiKey?: string;
      userBaseUrl?: string;
      selectedModel?: string;
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

  // 检查是否有任何可用的 API Key
  if (!userApiKey && !process.env.OPENAI_API_KEY && !process.env.DEEPSEEK_API_KEY) {
    return Response.json(
      { error: "未配置 API Key。请在设置中填入您的 API Key，或在服务器 .env.local 中配置。" },
      { status: 500 },
    );
  }

  try {
    const model = getModel(
      userApiKey ?? "",
      userBaseUrl ?? "",
      selectedModel ?? "",
    );

    const result = await generateText({
      model,
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
