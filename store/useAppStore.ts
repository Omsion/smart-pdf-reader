import { create } from "zustand";

interface AppState {
  pdfFile: File | null;
  pdfUrl: string | null;
  currentPage: number;
  selectedText: string;
  isSidebarOpen: boolean;
  scale: number;
  documentText: string;
  chatInputText: string;
  setPdfFile: (file: File | null) => void;
  setCurrentPage: (page: number) => void;
  setSelectedText: (text: string) => void;
  toggleSidebar: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetScale: () => void;
  setDocumentText: (text: string) => void;
  setChatInputText: (text: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  pdfFile: null,
  pdfUrl: null,
  currentPage: 1,
  selectedText: "",
  isSidebarOpen: true,
  scale: 1.0,
  documentText: "",
  chatInputText: "",
  setPdfFile: (file) => {
    // 清理旧的 Object URL，防止内存泄漏
    const oldUrl = get().pdfUrl;
    if (oldUrl) URL.revokeObjectURL(oldUrl);

    const pdfUrl = file ? URL.createObjectURL(file) : null;
    set({ pdfFile: file, pdfUrl, currentPage: 1, documentText: "" });
  },
  setCurrentPage: (page) => set({ currentPage: page }),
  setSelectedText: (text) => set({ selectedText: text }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  zoomIn: () =>
    set((state) => ({
      scale: Math.min(state.scale + 0.2, 3.0),
    })),
  zoomOut: () =>
    set((state) => ({
      scale: Math.max(state.scale - 0.2, 0.5),
    })),
  resetScale: () => set({ scale: 1.0 }),
  setDocumentText: (text) => set({ documentText: text }),
  setChatInputText: (text) => set({ chatInputText: text }),
}));
