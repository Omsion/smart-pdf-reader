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
      <ResizablePanelGroup
        orientation="horizontal"
        className="w-full"
        resizeTargetMinimumSize={{ coarse: 37, fine: 8 }}
      >
        <ResizablePanel
          defaultSize={60}
          minSize={30}
          maxSize={80}
          className="h-full"
        >
          <PdfViewerWrapper />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel
          defaultSize={40}
          minSize={20}
          maxSize={70}
          className="h-full"
        >
          <ChatPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
      <FloatingToolbar />
    </div>
  );
}
