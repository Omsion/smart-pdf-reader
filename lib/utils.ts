import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 将 AI 输出的 LaTeX 风格数学分隔符转换为 remark-math 可识别的 $/$$ 格式。
 *
 * DeepSeek 等模型常输出 \(...\) / \[...\] 格式的 LaTeX 公式，
 * 但 remark-math 默认只解析 $...$ / $$...$$。
 * 此函数在传入 ReactMarkdown 前做预处理。
 *
 * 转换规则：
 *   \(...\)  → $...$       (行内公式)
 *   \[...\]  → $$...$$     (块级公式)
 */
export function normalizeMathDelimiters(text: string): string {
  return text
    // 块级公式: \[ ... \] → $$ ... $$
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, math: string) => `$$\n${math.trim()}\n$$`)
    // 行内公式: \( ... \) → $ ... $
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math: string) => `$${math.trim()}$`)
}
