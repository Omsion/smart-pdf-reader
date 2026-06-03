"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

// pdf.js worker — 从本地 public/ 目录加载，无需外部 CDN
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export default function PdfViewer() {
  const pdfUrl = useAppStore((s) => s.pdfUrl);
  const currentPage = useAppStore((s) => s.currentPage);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const setSelectedText = useAppStore((s) => s.setSelectedText);
  const [numPages, setNumPages] = useState(0);

  const handleDocumentLoadSuccess = (data: { numPages: number }) => {
    setNumPages(data.numPages);
  };

  const handleMouseUp = () => {
    // 延迟执行，确保 selection 已生效
    setTimeout(() => {
      const text = window.getSelection()?.toString().trim() ?? "";
      setSelectedText(text);
    }, 0);
  };

  if (!pdfUrl) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <FileText className="h-12 w-12" />
          <p className="text-sm">上传 PDF 文件以开始阅读</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-muted/30" onMouseUp={handleMouseUp}>
      {/* PDF 渲染区 */}
      <div className="flex flex-1 justify-center overflow-auto p-4">
        <Document
          file={pdfUrl}
          onLoadSuccess={handleDocumentLoadSuccess}
          className="flex flex-col items-center"
        >
          <Page
            pageNumber={currentPage}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-lg"
            width={700}
          />
        </Document>
      </div>

      {/* 底部分页控制 */}
      {numPages > 0 && (
        <div className="flex h-12 shrink-0 items-center justify-center gap-4 border-t border-border bg-card text-sm">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="tabular-nums text-muted-foreground">
            {currentPage} / {numPages}
          </span>
          <button
            disabled={currentPage >= numPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
