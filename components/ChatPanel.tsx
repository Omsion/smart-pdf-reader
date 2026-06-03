import { MessageCircle, Send } from "lucide-react";

export default function ChatPanel() {
  return (
    <aside className="flex w-2/5 shrink-0 flex-col border-l border-border bg-card">
      {/* 上下文控制区 */}
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground">AI 问答</p>
      </div>

      {/* 对话列表区（占位） */}
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
        <MessageCircle className="h-10 w-10" />
        <p className="text-sm">选中文本后开始对话</p>
      </div>

      {/* 底部输入区 */}
      <div className="flex items-center gap-2 border-t border-border px-3 py-2">
        <input
          type="text"
          placeholder="输入问题..."
          disabled
          className="h-9 flex-1 rounded-md border border-border bg-muted/50 px-3 text-sm outline-none"
        />
        <button
          disabled
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
