"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
  const scale = useAppStore((s) => s.scale);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const setSelectedText = useAppStore((s) => s.setSelectedText);
  const setDocumentText = useAppStore((s) => s.setDocumentText);
  const [numPages, setNumPages] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const handleDocumentLoadSuccess = (data: { numPages: number }) => {
    setNumPages(data.numPages);
  };

  // 后台静默提取 PDF 全文，存入 Zustand
  useEffect(() => {
    if (!pdfUrl) {
      setDocumentText("");
      return;
    }

    let cancelled = false;
    setIsExtracting(true);

    const extractText = async () => {
      try {
        const pdf = await pdfjs.getDocument(pdfUrl).promise;
        const totalPages = pdf.numPages;
        const pageTexts: string[] = [];

        for (let i = 1; i <= totalPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          // 过滤掉标记内容，只保留有 str 属性的文本条目
          const text = (content.items as Array<{ str?: string }>)
            .filter((item) => typeof item.str === "string")
            .map((item) => item.str!)
            .join(" ");
          pageTexts.push(`[第 ${i} 页]\n${text}`);
        }

        if (!cancelled) {
          setDocumentText(pageTexts.join("\n\n"));
        }
      } catch (err) {
        if (!cancelled) {
          console.error("PDF 文本提取失败:", err);
        }
      } finally {
        if (!cancelled) {
          setIsExtracting(false);
        }
      }
    };

    extractText();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl, setDocumentText]);

  const handleMouseUp = () => {
    setTimeout(() => {
      const text = window.getSelection()?.toString().trim() ?? "";
      setSelectedText(text);
    }, 0);
  };

  // 设置每一页的 ref，用于滚动定位和当前页检测
  const setPageRef = useCallback((pageNumber: number, el: HTMLDivElement | null) => {
    if (el) {
      pageRefs.current.set(pageNumber, el);
    } else {
      pageRefs.current.delete(pageNumber);
    }
  }, []);

  // 监听滚动，自动更新当前页码
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || numPages === 0) return;

    const handleScroll = () => {
      const containerTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const midPoint = containerTop + containerHeight / 2;

      let closestPage = 1;
      let closestDistance = Infinity;

      pageRefs.current.forEach((el, page) => {
        const rect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const pageCenter = rect.top + rect.height / 2 - containerRect.top + containerTop;
        const distance = Math.abs(pageCenter - midPoint);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestPage = page;
        }
      });

      if (closestPage !== currentPage) {
        setCurrentPage(closestPage);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [numPages, currentPage, setCurrentPage]);

  // 快捷跳转到指定页
  const scrollToPage = (page: number) => {
    const el = pageRefs.current.get(page);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
      {/* PDF 连续滚动区 */}
      <div
        ref={scrollContainerRef}
        className="flex flex-1 flex-col items-center overflow-y-auto p-4"
      >
        <Document
          file={pdfUrl}
          onLoadSuccess={handleDocumentLoadSuccess}
          className="flex flex-col items-center"
          loading={
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-muted-foreground">加载 PDF...</p>
            </div>
          }
        >
          {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => (
            <div
              key={pageNumber}
              ref={(el) => setPageRef(pageNumber, el)}
              className="mb-4"
            >
              <Page
                pageNumber={pageNumber}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-lg"
                width={700}
                scale={scale}
              />
            </div>
          ))}
        </Document>
      </div>

      {/* 底部分页控制 — 快捷跳转 */}
      {numPages > 0 && (
        <div className="flex h-12 shrink-0 items-center justify-center gap-4 border-t border-border bg-card text-sm">
          <button
            disabled={currentPage <= 1}
            onClick={() => scrollToPage(currentPage - 1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="tabular-nums text-muted-foreground">
            {currentPage} / {numPages}
          </span>
          <button
            disabled={currentPage >= numPages}
            onClick={() => scrollToPage(currentPage + 1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
