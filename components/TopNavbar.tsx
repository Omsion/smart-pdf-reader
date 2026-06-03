"use client";

import { useRef } from "react";
import { FileUp, RotateCw, ZoomIn, ZoomOut, Highlighter } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function TopNavbar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setPdfFile = useAppStore((s) => s.setPdfFile);
  const pdfFile = useAppStore((s) => s.pdfFile);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
      {/* 左侧：Logo & 工具栏 */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold tracking-tight">Smart PDF Reader</h1>
        {pdfFile && (
          <div className="flex items-center gap-1">
            <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
              <RotateCw className="h-4 w-4" />
            </button>
            <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
              <ZoomIn className="h-4 w-4" />
            </button>
            <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
              <ZoomOut className="h-4 w-4" />
            </button>
            <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
              <Highlighter className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

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
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <FileUp className="h-3.5 w-3.5" />
          {pdfFile ? pdfFile.name : "上传 PDF"}
        </button>
      </div>
    </header>
  );
}
