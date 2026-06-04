"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Languages,
  Lightbulb,
  FileText,
  Loader2,
  AlertCircle,
  X,
  SendHorizontal,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAppStore } from "@/store/useAppStore";

type ActionType = "翻译" | "解释" | "总结";

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

/** 视口边界安全定位：确保弹窗不出屏 */
function clampPosition(
  desiredX: number,
  desiredY: number,
  popupWidth: number,
  popupHeight: number,
) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = 12;

  const x = Math.min(Math.max(desiredX - popupWidth / 2, margin), vw - popupWidth - margin);
  const y = Math.min(desiredY + margin, vh - popupHeight - margin);

  return { x: Math.max(x, margin), y: Math.max(y, margin) };
}

export default function FloatingToolbar() {
  const selectedText = useAppStore((s) => s.selectedText);
  const setChatInputText = useAppStore((s) => s.setChatInputText);

  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);

  // 选中文本变化时重新计算位置
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

  const handleClose = () => {
    setActionType(null);
    setIsLoading(false);
    setResult(null);
    setError(null);
  };

  const handleSendToChat = () => {
    if (!result) return;
    const chatMsg = `**划词${actionType}**：\n\n> ${selectedText}\n\n${result}`;
    setChatInputText(chatMsg);
  };

  if (!selectedText || !position) return null;

  // 弹窗尺寸常量（用于边界计算）
  const POPUP_W = 360;
  const POPUP_H = 420;

  const resultPos = clampPosition(position.x, position.y, POPUP_W, POPUP_H);

  return (
    <>
      {/* 悬浮菜单 — 位于选中文字正上方 */}
      <div
        className="pointer-events-auto fixed z-50 -translate-x-1/2 -translate-y-full"
        style={{ left: position.x, top: position.y - 8 }}
      >
        <div className="flex items-center gap-0.5 rounded-lg bg-zinc-800/90 px-1.5 py-1 shadow-lg backdrop-blur-sm">
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

      {/* 结果弹窗 — 毛玻璃卡片，自动避开屏幕边界 */}
      {(actionType || isLoading || result || error) && (
        <div
          ref={resultRef}
          className="pointer-events-auto fixed z-50"
          style={{ left: resultPos.x, top: resultPos.y }}
        >
          <div className="w-[360px] max-h-[420px] flex flex-col rounded-xl border border-border/50 bg-card/80 shadow-2xl backdrop-blur-xl">
            {/* 顶部操作栏 */}
            <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-4 py-2">
              <span className="text-xs font-medium text-muted-foreground">
                {actionType}
              </span>
              <button
                onClick={handleClose}
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* 内容区 */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
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
                <div className="max-h-[280px] overflow-y-auto text-sm leading-relaxed text-foreground prose prose-sm dark:prose-invert">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              )}
            </div>

            {/* 底部操作栏 */}
            {result && !isLoading && !error && (
              <div className="flex shrink-0 items-center border-t border-border/50 px-4 py-2">
                <button
                  onClick={handleSendToChat}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  <SendHorizontal className="h-3.5 w-3.5" />
                  发送到右侧对话
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
