import { create } from "zustand";

// ── 手动 localStorage 持久化（避免 SSR/水合竞态）──────────────────

const STORAGE_KEY = "smart-pdf-reader-config";

interface UserConfig {
  userApiKey: string;
  userBaseUrl: string;
  selectedModel: string;
}

function loadConfig(): Partial<UserConfig> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<UserConfig>) : {};
  } catch {
    return {};
  }
}

function saveConfig(patch: Partial<UserConfig>): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadConfig();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...current, ...patch }),
    );
  } catch {
    // localStorage 不可用时静默降级（如隐身模式）
  }
}

const saved = loadConfig();

// ── Store ────────────────────────────────────────────────────────

interface AppState {
  pdfFile: File | null;
  pdfUrl: string | null;
  currentPage: number;
  selectedText: string;
  isSidebarOpen: boolean;
  scale: number;
  documentText: string;
  chatInputText: string;

  // 用户 API 配置（手动持久化到 localStorage）
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

export const useAppStore = create<AppState>()((set, get) => ({
  pdfFile: null,
  pdfUrl: null,
  currentPage: 1,
  selectedText: "",
  isSidebarOpen: true,
  scale: 1.0,
  documentText: "",
  chatInputText: "",

  // 从 localStorage 恢复已保存的配置，否则用默认值
  userApiKey: saved.userApiKey ?? "",
  userBaseUrl: saved.userBaseUrl ?? "",
  selectedModel: saved.selectedModel ?? "deepseek-v4-flash",

  setPdfFile: (file) => {
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
    set((state) => ({ scale: Math.min(state.scale + 0.2, 3.0) })),
  zoomOut: () =>
    set((state) => ({ scale: Math.max(state.scale - 0.2, 0.5) })),
  resetScale: () => set({ scale: 1.0 }),
  setDocumentText: (text) => set({ documentText: text }),
  setChatInputText: (text) => set({ chatInputText: text }),

  // 用户配置 setters —— 同时写入 localStorage + Zustand
  setUserApiKey: (key) => {
    saveConfig({ userApiKey: key });
    set({ userApiKey: key });
  },
  setUserBaseUrl: (url) => {
    saveConfig({ userBaseUrl: url });
    set({ userBaseUrl: url });
  },
  setSelectedModel: (model) => {
    saveConfig({ selectedModel: model });
    set({ selectedModel: model });
  },
}));
