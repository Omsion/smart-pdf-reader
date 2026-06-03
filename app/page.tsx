import TopNavbar from "@/components/TopNavbar";
import PdfViewer from "@/components/PdfViewer";
import ChatPanel from "@/components/ChatPanel";

export default function Home() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <TopNavbar />
      <div className="flex flex-1 overflow-hidden">
        <PdfViewer />
        <ChatPanel />
      </div>
    </div>
  );
}
