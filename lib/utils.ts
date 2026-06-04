import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 将 AI 输出的各种非标准数学公式格式统一转换为 remark-math 可识别的 $/$$ 格式。
 *
 * 常见问题：
 *   1. \(...\) / \[...\]  — LaTeX 原生分隔符，remark-math 不识别
 *   2. 裸写公式 — 块级公式无任何分隔符（最常见）
 *   3. \begin{env}...\end{env} — LaTeX 环境，不直接支持
 *   4. 多行公式 — 单个公式被拆分到多行，需合并后再包裹
 */
export function normalizeMathDelimiters(text: string): string {
  let result = text;

  // ── 阶段 A：将非标准分隔符统一转换为 $ / $$ ──────────────────

  // A1. \[...\] → $$...$$
  result = result.replace(
    /\\\[([\s\S]*?)\\\]/g,
    (_m, math: string) => `$$\n${math.trim()}\n$$`,
  );
  // A2. \(...\) → $...$
  result = result.replace(
    /\\\(([\s\S]*?)\\\)/g,
    (_m, math: string) => `$${math.trim()}$`,
  );
  // A3. \begin{env}...\end{env} → $$...$$（KaTeX 支持的矩阵/对齐等环境）
  result = result.replace(
    /\\begin\{([a-zA-Z*]+)\}([\s\S]*?)\\end\{\1\}/g,
    (_m: string, env: string, content: string) =>
      `$$\n\\begin{${env}}${content}\\end{${env}}\n$$`,
  );

  // ── 阶段 B：保护所有已有的标准数学块（$$...$$ 和 $...$）───

  const protectedBlocks: string[] = [];
  result = result.replace(
    /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g,
    (match: string) => {
      protectedBlocks.push(match);
      return `%%PROTECTED_${protectedBlocks.length - 1}%%`;
    },
  );

  // ── 阶段 C：多行感知地检测残留的裸 LaTeX 公式 ──────────────

  const lines = result.split("\n");
  const output: string[] = [];
  const mathBuffer: string[] = [];

  const hasLatexCmd = (line: string): boolean => /\\[a-zA-Z]+/.test(line);

  for (const line of lines) {
    const trimmed = line.trim();
    const isProtected = line.includes("%%PROTECTED_");
    const isEmpty = trimmed.length === 0;

    if (!isProtected && !isEmpty && hasLatexCmd(line)) {
      // 累积连续含 LaTeX 命令的行（处理多行公式）
      mathBuffer.push(line);
    } else {
      // 非公式行：先清空已累积的公式缓冲
      if (mathBuffer.length > 0) {
        output.push(`$$\n${mathBuffer.join("\n").trim()}\n$$`);
        mathBuffer.length = 0;
      }
      output.push(line);
    }
  }
  // 最后清空残留的公式缓冲
  if (mathBuffer.length > 0) {
    output.push(`$$\n${mathBuffer.join("\n").trim()}\n$$`);
  }

  result = output.join("\n");

  // ── 阶段 D：恢复受保护的数学块 ──────────────────────────────

  result = result.replace(/%%PROTECTED_(\d+)%%/g, (_m, idx: string) => {
    const i = parseInt(idx);
    return protectedBlocks[i] ?? "";
  });

  return result;
}
