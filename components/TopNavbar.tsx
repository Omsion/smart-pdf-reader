"use client";

import { useRef } from "react";
import { FileUp, RotateCw, ZoomIn, ZoomOut, Highlighter, Upload } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function TopNavbar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setPdfFile = useAppStore((s) => s.setPdfFile);
  const pdfFile = useAppStore((s) => s.pdfFile);
  const scale = useAppStore((s) => s.scale);
  const isHighlightMode = useAppStore((s) => s.isHighlightMode);
  const zoomIn = useAppStore((s) => s.zoomIn);
  const zoomOut = useAppStore((s) => s.zoomOut);
  const resetScale = useAppStore((s) => s.resetScale);
  const toggleHighlightMode = useAppStore((s) => s.toggleHighlightMode);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    }
  };

  return (
    <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
      {/* 左侧：Logo & 工具栏 */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold tracking-tight">Smart PDF Reader</h1>
        {pdfFile && (
          <div className="flex items-center gap-1">
            <button
              onClick={resetScale}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              title="重置缩放"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <button
              onClick={zoomIn}
              disabled={scale >= 3.0}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
              title="放大"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
              title="缩小"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={toggleHighlightMode}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                isHighlightMode
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
              title="高亮模式"
            >
              <Highlighter className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* 中间：当前文件名（绝对居中） */}
      {pdfFile && (
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[300px] truncate text-sm text-muted-foreground"
          title={pdfFile.name}
        >
          {pdfFile.name}
        </span>
      )}

      {/* 右侧：上传按钮 */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload PDF
        </button>
      </div>
    </header>
  );
}
