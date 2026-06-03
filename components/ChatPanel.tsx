"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAppStore } from "@/store/useAppStore";

/** 从 UIMessage 的 parts 数组中提取纯文本内容 */
function getMessageText(msg: UIMessage): string {
  return msg.parts.filter(isTextUIPart).map((p) => p.text).join("");
}

export default function ChatPanel() {
  const selectedText = useAppStore((s) => s.selectedText);
  const currentPage = useAppStore((s) => s.currentPage);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    error,
  } = useChat({
    api: "/api/chat",
    body: {
      contextMode: "full-document",
      currentPage,
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isLoading = status === "submitted" || status === "streaming";

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 当用户选中 PDF 文本时，自动填充到输入框（仅在输入框为空时）
  useEffect(() => {
    if (selectedText && !input && inputRef.current) {
      // 通过原生 DOM 操作设置 input value，然后派发 input 事件
      // 这样 useChat 的 handleInputChange 能正确捕获到
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      nativeInputValueSetter?.call(inputRef.current, selectedText);
      inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }, [selectedText]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(e);
  };

  return (
    <aside className="flex w-2/5 shrink-0 flex-col border-l border-border bg-card">
      {/* 标题区 */}
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground">AI 问答</p>
      </div>

      {/* 对话列表区 */}
      <div className="flex flex-1 flex-col gap-3 overflow-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
            <MessageCircle className="h-10 w-10" />
            <p className="text-sm">在下方输入问题，开始与 AI 对话</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground whitespace-pre-wrap"
                    : "bg-muted text-foreground prose prose-sm dark:prose-invert max-w-none"
                }`}
              >
                {msg.role === "user" ? (
                  msg.content
                ) : msg.content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <span className="text-muted-foreground">...</span>
                )}
              </div>
            </div>
          ))
        )}
        {/* 错误提示 */}
        {error && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error.message || "请求失败，请重试"}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 底部输入区 */}
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-border px-3 py-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="输入问题..."
          disabled={isLoading}
          className="h-9 flex-1 rounded-md border border-border bg-muted/50 px-3 text-sm outline-none focus:border-primary/50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </aside>
  );
}
