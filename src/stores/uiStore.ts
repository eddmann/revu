import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DiffViewMode = "split" | "unified";
export type Theme = "light" | "dark" | "system";

interface UiState {
  diffViewMode: DiffViewMode;
  theme: Theme;
  sidebarWidth: number;
  showCommentsPanel: boolean;
  showFullFileContext: boolean;
  ignoreWhitespace: boolean;

  setDiffViewMode: (mode: DiffViewMode) => void;
  setTheme: (theme: Theme) => void;
  setSidebarWidth: (width: number) => void;
  toggleCommentsPanel: () => void;
  setShowCommentsPanel: (show: boolean) => void;
  setShowFullFileContext: (show: boolean) => void;
  setIgnoreWhitespace: (ignore: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      diffViewMode: "unified",
      theme: "system",
      sidebarWidth: 280,
      showCommentsPanel: false,
      showFullFileContext: false,
      ignoreWhitespace: false,

      setDiffViewMode: (mode) => set({ diffViewMode: mode }),
      setTheme: (theme) => set({ theme }),
      setSidebarWidth: (width) =>
        set({ sidebarWidth: Math.max(200, Math.min(500, width)) }),
      toggleCommentsPanel: () =>
        set((state) => ({ showCommentsPanel: !state.showCommentsPanel })),
      setShowCommentsPanel: (show) => set({ showCommentsPanel: show }),
      setShowFullFileContext: (show) => set({ showFullFileContext: show }),
      setIgnoreWhitespace: (ignore) => set({ ignoreWhitespace: ignore }),
    }),
    {
      name: "revu-ui",
    },
  ),
);
