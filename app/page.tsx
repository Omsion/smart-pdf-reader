import TopNavbar from "@/components/TopNavbar";
import PdfViewerWrapper from "@/components/PdfViewerWrapper";
import ChatPanel from "@/components/ChatPanel";
import FloatingToolbar from "@/components/FloatingToolbar";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export default function Home() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <TopNavbar />
      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        <ResizablePanel defaultSize={60} minSize={30} maxSize={80}>
          <PdfViewerWrapper />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={40} minSize={20} maxSize={70}>
          <ChatPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
      <FloatingToolbar />
    </div>
  );
}
