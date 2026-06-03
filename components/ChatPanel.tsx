"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatPanel() {
  const selectedText = useAppStore((s) => s.selectedText);
  const currentPage = useAppStore((s) => s.currentPage);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 当用户选中文本时，自动填充到输入框
  useEffect(() => {
    if (selectedText) {
      setInput((prev) => prev ? prev : selectedText);
    }
  }, [selectedText]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          contextMode: "full-document",
          currentPage,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || `请求失败 (${res.status})`);
      }

      // 处理流式响应
      const reader = res.body?.getReader();
      if (!reader) throw new Error("无法读取响应流");

      const decoder = new TextDecoder();
      const assistantId = (Date.now() + 1).toString();
      let assistantContent = "";

      // 先添加空的 assistant 消息
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;

        // 更新 assistant 消息内容
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: assistantContent }
              : m,
          ),
        );
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "请求失败，请重试";
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: `❌ 错误：${errorMsg}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.content || (msg.role === "assistant" && isLoading ? "..." : "")}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 底部输入区 */}
      <div className="flex items-center gap-2 border-t border-border px-3 py-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入问题..."
          disabled={isLoading}
          className="h-9 flex-1 rounded-md border border-border bg-muted/50 px-3 text-sm outline-none focus:border-primary/50"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
