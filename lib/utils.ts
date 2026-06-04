import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 将 AI 输出的各种非标准数学公式格式统一转换为 remark-math 可识别的 $/$$ 格式。
 *
 * DeepSeek 等模型经常输出格式不一致的 LaTeX 公式，常见问题：
 *   1. 使用 LaTeX 原生分隔符 \(...\) / \[...\]，而非 remark-math 期望的 $/$$
 *   2. 块级公式完全没有分隔符，依赖空行/缩进区分（如论文公式）
 *   3. 混合使用不同分隔符导致 $ 配对错误
 *
 * 此函数在传入 ReactMarkdown 前做多轮正则预处理。
 */
export function normalizeMathDelimiters(text: string): string {
  // 步骤 1：保护已有的标准分隔符，避免被后续步骤误处理
  // 将 $$...$$ 块标记为已处理，后续不再触碰
  const protectedBlocks: string[] = [];
  let result = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, math: string) => {
    protectedBlocks.push(`$$\n${math.trim()}\n$$`);
    return `%%MATH_BLOCK_${protectedBlocks.length - 1}%%`;
  });

  // 步骤 2：将 LaTeX 原生分隔符 \[...\] 转为 $$...$$
  result = result.replace(
    /\\\[([\s\S]*?)\\\]/g,
    (_m, math: string) => `$$\n${math.trim()}\n$$`,
  );
  // 步骤 3：将 LaTeX 原生分隔符 \(...\) 转为 $...$
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_m, math: string) => `$${math.trim()}$`);

  // 步骤 4：检测无分隔符的块级 LaTeX 公式
  // 特征：独立行，包含 \frac、\sum、\int、\exp、\left、\mathbb、\mathbf、\begin 等 LaTeX 命令，
  // 且不包含 $ 符号（说明未被步骤 2/3 处理，也未在步骤 1 中）
  const mathCmdPattern =
    /(\\frac|\\sum|\\int|\\prod|\\lim|\\exp|\\log|\\ln|\\sin|\\cos|\\tan|\\left|\\right|\\mathbb|\\mathbf|\\mathcal|\\begin|\\text|\\max|\\min|\\arg|\\operatorname|\\partial|\\infty|\\cdot|\\times|\\approx|\\equiv|\\sim|\\leq|\\geq|\\neq|\\forall|\\exists|\\in|\\notin|\\subset|\\subseteq|\\cup|\\cap|\\setminus|\\otimes|\\oplus|\\rightarrow|\\Rightarrow|\\Leftrightarrow|\\langle|\\rangle|\\|)/;

  result = result.replace(
    /^((?:(?!%%MATH_BLOCK_)[^\n$])*?(?:\\[a-zA-Z]+|[_^]\{).*?)$/gm,
    (line: string) => {
      // 跳过已保护的块
      if (line.startsWith("%%MATH_BLOCK_")) return line;
      // 跳过包含 $ 的行（已被处理或用户已正确使用 $ 分隔符）
      if (line.includes("$")) return line;
      // 跳过纯文本行（不包含 LaTeX 命令且不包含 _{} 或 ^{} 模式）
      if (!mathCmdPattern.test(line)) return line;
      // 检测到孤立的 LaTeX 公式行 → 包裹为块级公式
      return `$$\n${line.trim()}\n$$`;
    },
  );

  // 步骤 5：恢复受保护的 $$...$$ 块
  result = result.replace(/%%MATH_BLOCK_(\d+)%%/g, (_m, idx: string) => {
    const i = parseInt(idx);
    return protectedBlocks[i] ?? "";
  });

  return result;
}
