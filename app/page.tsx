import TopNavbar from "@/components/TopNavbar";
import PdfViewerWrapper from "@/components/PdfViewerWrapper";
import ChatPanel from "@/components/ChatPanel";
import FloatingToolbar from "@/components/FloatingToolbar";

export default function Home() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <TopNavbar />
      <div className="flex flex-1 overflow-hidden">
        <PdfViewerWrapper />
        <ChatPanel />
      </div>
      <FloatingToolbar />
    </div>
  );
}
