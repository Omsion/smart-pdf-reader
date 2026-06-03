"use client";

import dynamic from "next/dynamic";

const PdfViewer = dynamic(() => import("@/components/PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center bg-muted/30">
      <p className="text-sm text-muted-foreground">加载 PDF 查看器...</p>
    </div>
  ),
});

export default function PdfViewerWrapper() {
  return <PdfViewer />;
}
