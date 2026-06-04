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
  const documentText = useAppStore((s) => s.documentText);
  const chatInputText = useAppStore((s) => s.chatInputText);

  const {
    messages,
    sendMessage,
    status,
    error,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        documentText,
        currentPage,
      },
    }),
  });

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isLoading = status === "submitted" || status === "streaming";

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 当用户选中 PDF 文本时，自动填充到输入框（仅在输入框为空时）
  useEffect(() => {
    if (selectedText && !input) {
      setInput(selectedText);
    }
  }, [selectedText]);

  // 接收来自 FloatingToolbar 的"发送到对话"联动
  useEffect(() => {
    if (chatInputText) {
      setInput(chatInputText);
      // 清除 store 中的暂存，防止重复填充
      useAppStore.getState().setChatInputText("");
    }
  }, [chatInputText]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage({ text });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter：手动插入换行符
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      const textarea = e.currentTarget;
      const { selectionStart, selectionEnd } = textarea;
      const newValue =
        input.slice(0, selectionStart) + "\n" + input.slice(selectionEnd);
      setInput(newValue);
      // 将光标放到换行符之后
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
      });
      return;
    }
    // Shift+Enter：浏览器默认换行，不做处理
    if (e.key === "Enter" && e.shiftKey) {
      return;
    }
    // 单独 Enter：发送
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <aside className="flex h-full w-full flex-col border-l border-border bg-card">
      {/* 标题区 */}
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground">AI 问答</p>
      </div>

      {/* 对话列表区 */}
      <div className="flex flex-col flex-1 w-full overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <MessageCircle className="h-10 w-10" />
            <p className="text-sm">在下方输入问题，开始与 AI 对话</p>
          </div>
        ) : (
          messages.map((msg) => {
              const content = getMessageText(msg);
              return (
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
                  content
                ) : content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                  </ReactMarkdown>
                ) : (
                  <span className="text-muted-foreground">...</span>
                )}
              </div>
            </div>
              );
            })
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
      <div className="mt-auto w-full border-t border-border bg-background p-4">
        <div className="flex items-end gap-2 w-full">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入问题...（Enter 发送，Ctrl+Enter 换行）"
          rows={1}
          disabled={isLoading}
          className="flex-1 resize-none rounded-md border border-border bg-muted/50 px-3 py-2 text-sm outline-none focus:border-primary/50"
          style={{ maxHeight: "8rem" }}
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
      </div>
    </aside>
  );
}
