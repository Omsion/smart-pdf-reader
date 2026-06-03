import { create } from "zustand";

interface AppState {
  pdfFile: File | null;
  pdfUrl: string | null;
  currentPage: number;
  selectedText: string;
  isSidebarOpen: boolean;
  setPdfFile: (file: File | null) => void;
  setCurrentPage: (page: number) => void;
  setSelectedText: (text: string) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  pdfFile: null,
  pdfUrl: null,
  currentPage: 1,
  selectedText: "",
  isSidebarOpen: true,
  setPdfFile: (file) => {
    // 清理旧的 Object URL，防止内存泄漏
    const oldUrl = get().pdfUrl;
    if (oldUrl) URL.revokeObjectURL(oldUrl);

    const pdfUrl = file ? URL.createObjectURL(file) : null;
    set({ pdfFile: file, pdfUrl, currentPage: 1 });
  },
  setCurrentPage: (page) => set({ currentPage: page }),
  setSelectedText: (text) => set({ selectedText: text }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
