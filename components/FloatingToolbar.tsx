"use client";

import { useState, useEffect, useCallback } from "react";
import { Languages, Lightbulb, FileText, Loader2, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAppStore } from "@/store/useAppStore";

type ActionType = "翻译" | "解释" | "总结";

// 中文按钮名 → 后端 action key
const ACTION_MAP: Record<ActionType, string> = {
  "翻译": "translate",
  "解释": "explain",
  "总结": "summarize",
};

async function callActionApi(text: string, action: ActionType): Promise<string> {
  const res = await fetch("/api/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, action: ACTION_MAP[action] }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `请求失败 (${res.status})`);
  }

  const data = await res.json();
  return data.result;
}

export default function FloatingToolbar() {
  const selectedText = useAppStore((s) => s.selectedText);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 选中文本变化时重新计算位置，重置弹窗状态
  useEffect(() => {
    if (!selectedText) {
      setPosition(null);
      setActionType(null);
      setIsLoading(false);
      setResult(null);
      setError(null);
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const rect = selection.getRangeAt(0).getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
    setActionType(null);
    setIsLoading(false);
    setResult(null);
    setError(null);
  }, [selectedText]);

  const handleAction = useCallback(
    async (action: ActionType) => {
      if (!selectedText) return;
      setActionType(action);
      setIsLoading(true);
      setResult(null);
      setError(null);

      try {
        const text = await callActionApi(selectedText, action);
        setResult(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : "请求失败，请重试");
      } finally {
        setIsLoading(false);
      }
    },
    [selectedText],
  );

  if (!selectedText || !position) return null;

  return (
    <>
      {/* 悬浮菜单 — 位于选中文字正上方 */}
      <div
        className="pointer-events-auto fixed z-50 -translate-x-1/2 -translate-y-full"
        style={{ left: position.x, top: position.y - 8 }}
      >
        <div className="flex items-center gap-0.5 rounded-lg bg-zinc-800 px-1.5 py-1 shadow-lg">
          <button
            onClick={() => handleAction("翻译")}
            disabled={isLoading}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            <Languages className="h-3.5 w-3.5" />
            翻译
          </button>
          <button
            onClick={() => handleAction("解释")}
            disabled={isLoading}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            解释
          </button>
          <button
            onClick={() => handleAction("总结")}
            disabled={isLoading}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            <FileText className="h-3.5 w-3.5" />
            总结
          </button>
        </div>
      </div>

      {/* 结果弹窗 — 位于悬浮菜单下方 */}
      {(actionType || isLoading || result || error) && (
        <div
          className="pointer-events-auto fixed z-50 -translate-x-1/2"
          style={{ left: position.x, top: position.y + 12 }}
        >
          <div className="w-80 rounded-lg border border-border bg-card p-4 shadow-xl">
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              {actionType}
            </div>

            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在生成{actionType}结果...
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {result && !isLoading && !error && (
              <div className="max-h-64 overflow-auto text-sm leading-relaxed text-foreground prose prose-sm dark:prose-invert">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
