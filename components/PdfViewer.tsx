"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { FileText, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

// pdf.js worker — 从本地 public/ 目录加载，无需外部 CDN
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

// 占位页的预估高度（US Letter @ 700px 宽度 ≈ 906px，加 margin 余量）
const ESTIMATED_PAGE_HEIGHT = 920;

export default function PdfViewer() {
  const pdfUrl = useAppStore((s) => s.pdfUrl);
  const currentPage = useAppStore((s) => s.currentPage);
  const scale = useAppStore((s) => s.scale);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const setSelectedText = useAppStore((s) => s.setSelectedText);
  const setDocumentText = useAppStore((s) => s.setDocumentText);

  const [numPages, setNumPages] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState({ current: 0, total: 0 });

  // 渐进式渲染：初始只渲染前几页，其余用占位符，分批加载
  const BATCH_SIZE = 3;
  const [loadedPages, setLoadedPages] = useState(BATCH_SIZE);
  const [pageHeight, setPageHeight] = useState(ESTIMATED_PAGE_HEIGHT);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // 切换 PDF 时重置渐进渲染
  useEffect(() => {
    setLoadedPages(BATCH_SIZE);
    setPageHeight(ESTIMATED_PAGE_HEIGHT);
  }, [pdfUrl]);

  const handleDocumentLoadSuccess = (data: { numPages: number }) => {
    setNumPages(data.numPages);
  };

  // 第一页加载后，用真实尺寸更新占位符高度（避免占位和实际高度不一致）
  const handleFirstPageLoad = useCallback((page: { getViewport: (opts: { scale: number }) => { height: number; width: number } }) => {
    const viewport = page.getViewport({ scale: 1 });
    if (viewport.width > 0) {
      const realHeight = viewport.height * (700 / viewport.width);
      if (Math.abs(realHeight - pageHeight) > 50) {
        setPageHeight(realHeight);
      }
    }
  }, [pageHeight]);

  // 渐进加载更多页：每 150ms 释放一批，不阻塞 UI
  useEffect(() => {
    if (numPages <= loadedPages) return;

    const timer = setTimeout(() => {
      setLoadedPages((prev) => Math.min(prev + BATCH_SIZE, numPages));
    }, 150);

    return () => clearTimeout(timer);
  }, [numPages, loadedPages]);

  // 后台静默提取 PDF 全文（延迟启动 + 逐页 yield）
  useEffect(() => {
    if (!pdfUrl) {
      setDocumentText("");
      return;
    }

    let cancelled = false;
    setIsExtracting(true);
    setExtractProgress({ current: 0, total: 0 });

    const extractText = async () => {
      let phase2Start = 0;  // 记录阶段 2 开始时间，用于最小展示时长
      try {
        // 延迟 2s：等渐进渲染跑完开头几页再开始，避免争抢主线程
        await new Promise((resolve) => setTimeout(resolve, 2000));
        if (cancelled) return;

        const pdf = await pdfjs.getDocument(pdfUrl).promise;
        const totalPages = pdf.numPages;
        phase2Start = Date.now();
        setExtractProgress({ current: 0, total: totalPages });
        const pageTexts: string[] = [];

        for (let i = 1; i <= totalPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const text = (content.items as Array<{ str?: string }>)
            .filter((item) => typeof item.str === "string")
            .map((item) => item.str!)
            .join(" ");
          pageTexts.push(`[第 ${i} 页]\n${text}`);

          setExtractProgress({ current: i, total: totalPages });

          // 逐页释放主线程，同时给足够时间让进度条肉眼可见（30ms）
          await new Promise((resolve) => setTimeout(resolve, 30));
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
          // 确保阶段 2 至少显示 1.5 秒，避免进度条一闪而逝
          const elapsed = Date.now() - phase2Start;
          const minDisplay = 1500;
          if (elapsed < minDisplay) {
            await new Promise((r) => setTimeout(r, minDisplay - elapsed));
          }
          setIsExtracting(false);
          setExtractProgress({ current: 0, total: 0 });
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
    <div className="relative flex h-full w-full flex-col bg-muted/30" onMouseUp={handleMouseUp}>
      {/* PDF 文本提取进度遮罩 — 阶段 1：准备中（无进度） */}
      {isExtracting && extractProgress.total === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-xl bg-card border border-border px-8 py-6 shadow-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">
              正在准备 PDF 解析...
            </p>
            <p className="text-xs text-muted-foreground">
              请稍候
            </p>
          </div>
        </div>
      )}

      {/* PDF 文本提取进度遮罩 — 阶段 2：逐页提取（有进度条） */}
      {isExtracting && extractProgress.total > 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-xl bg-card border border-border px-8 py-6 shadow-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                正在解析 PDF 文本...
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                请稍候，不要进行其他操作
              </p>
            </div>
            <div className="w-full space-y-1.5">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{
                    width: `${Math.round((extractProgress.current / extractProgress.total) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-center text-xs text-muted-foreground tabular-nums">
                {extractProgress.current} / {extractProgress.total} 页
              </p>
            </div>
          </div>
        </div>
      )}

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
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-muted-foreground" />
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
              {pageNumber <= loadedPages ? (
                <Page
                  pageNumber={pageNumber}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-lg"
                  width={700}
                  scale={scale}
                  onLoadSuccess={
                    pageNumber === 1 ? handleFirstPageLoad : undefined
                  }
                />
              ) : (
                /* 占位符：撑开滚动高度，等渐进加载替换为真实页面 */
                <div
                  style={{ width: 700, height: pageHeight }}
                  className="flex items-center justify-center rounded-md bg-muted/20 animate-pulse"
                >
                  <span className="text-xs text-muted-foreground/50">
                    {pageNumber}
                  </span>
                </div>
              )}
            </div>
          ))}
        </Document>
      </div>

      {/* 底部分页控制 */}
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
