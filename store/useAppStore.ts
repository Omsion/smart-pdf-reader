import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  pdfFile: File | null;
  pdfUrl: string | null;
  currentPage: number;
  selectedText: string;
  isSidebarOpen: boolean;
  scale: number;
  documentText: string;
  chatInputText: string;

  // 用户 API 配置（持久化到 localStorage）
  userApiKey: string;
  userBaseUrl: string;
  selectedModel: string;

  setPdfFile: (file: File | null) => void;
  setCurrentPage: (page: number) => void;
  setSelectedText: (text: string) => void;
  toggleSidebar: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetScale: () => void;
  setDocumentText: (text: string) => void;
  setChatInputText: (text: string) => void;
  setUserApiKey: (key: string) => void;
  setUserBaseUrl: (url: string) => void;
  setSelectedModel: (model: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      pdfFile: null,
      pdfUrl: null,
      currentPage: 1,
      selectedText: "",
      isSidebarOpen: true,
      scale: 1.0,
      documentText: "",
      chatInputText: "",

      // 用户配置默认值
      userApiKey: "",
      userBaseUrl: "",
      selectedModel: "deepseek-v4-flash",

      setPdfFile: (file) => {
        // 清理旧的 Object URL，防止内存泄漏
        const oldUrl = get().pdfUrl;
        if (oldUrl) URL.revokeObjectURL(oldUrl);

        const pdfUrl = file ? URL.createObjectURL(file) : null;
        set({ pdfFile: file, pdfUrl, currentPage: 1, documentText: "" });
      },
      setCurrentPage: (page) => set({ currentPage: page }),
      setSelectedText: (text) => set({ selectedText: text }),
      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
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

      // 用户配置 setters
      setUserApiKey: (key) => set({ userApiKey: key }),
      setUserBaseUrl: (url) => set({ userBaseUrl: url }),
      setSelectedModel: (model) => set({ selectedModel: model }),
    }),
    {
      name: "smart-pdf-reader-config",
      // 仅持久化用户配置字段（pdfFile 等运行时状态不可序列化）
      partialize: (state) => ({
        userApiKey: state.userApiKey,
        userBaseUrl: state.userBaseUrl,
        selectedModel: state.selectedModel,
      }),
    },
  ),
);
