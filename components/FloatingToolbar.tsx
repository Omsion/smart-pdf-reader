"use client";

import { useState, useEffect, useCallback } from "react";
import { Languages, Lightbulb, FileText, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

type ActionType = "翻译" | "解释" | "总结";

function mockAiAction(action: ActionType, text: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const truncated = text.length > 50 ? text.slice(0, 50) + "..." : text;
      resolve(`这是基于选中内容 "${truncated}" 生成的${action}结果。`);
    }, 1500);
  });
}

export default function FloatingToolbar() {
  const selectedText = useAppStore((s) => s.selectedText);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // 选中文本变化时重新计算位置，重置弹窗状态
  useEffect(() => {
    if (!selectedText) {
      setPosition(null);
      setActionType(null);
      setIsLoading(false);
      setResult(null);
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
  }, [selectedText]);

  const handleAction = useCallback(
    async (action: ActionType) => {
      if (!selectedText) return;
      setActionType(action);
      setIsLoading(true);
      setResult(null);
      const text = await mockAiAction(action, selectedText);
      setIsLoading(false);
      setResult(text);
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
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            <Languages className="h-3.5 w-3.5" />
            翻译
          </button>
          <button
            onClick={() => handleAction("解释")}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            解释
          </button>
          <button
            onClick={() => handleAction("总结")}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            总结
          </button>
        </div>
      </div>

      {/* 结果弹窗 — 位于悬浮菜单下方 */}
      {(actionType || isLoading || result) && (
        <div
          className="pointer-events-auto fixed z-50 -translate-x-1/2"
          style={{ left: position.x, top: position.y + 12 }}
        >
          <div className="w-72 rounded-lg border border-border bg-card p-4 shadow-xl">
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              {actionType}
            </div>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在生成{actionType}结果...
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-foreground">{result}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
