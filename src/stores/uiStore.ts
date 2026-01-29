import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DiffViewMode = "split" | "unified";
export type Theme = "light" | "dark" | "system";

export interface ScrollToLine {
  line: number;
  isOld: boolean;
}

interface UiState {
  diffViewMode: DiffViewMode;
  theme: Theme;
  sidebarWidth: number;
  showCommentsPanel: boolean;
  showFullFileContext: boolean;
  ignoreWhitespace: boolean;
  scrollToLine: ScrollToLine | null;

  setDiffViewMode: (mode: DiffViewMode) => void;
  setTheme: (theme: Theme) => void;
  setSidebarWidth: (width: number) => void;
  toggleCommentsPanel: () => void;
  setShowCommentsPanel: (show: boolean) => void;
  setShowFullFileContext: (show: boolean) => void;
  setIgnoreWhitespace: (ignore: boolean) => void;
  setScrollToLine: (target: ScrollToLine | null) => void;
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
      scrollToLine: null,

      setDiffViewMode: (mode) => set({ diffViewMode: mode }),
      setTheme: (theme) => set({ theme }),
      setSidebarWidth: (width) =>
        set({ sidebarWidth: Math.max(200, Math.min(500, width)) }),
      toggleCommentsPanel: () =>
        set((state) => ({ showCommentsPanel: !state.showCommentsPanel })),
      setShowCommentsPanel: (show) => set({ showCommentsPanel: show }),
      setShowFullFileContext: (show) => set({ showFullFileContext: show }),
      setIgnoreWhitespace: (ignore) => set({ ignoreWhitespace: ignore }),
      setScrollToLine: (target) => set({ scrollToLine: target }),
    }),
    {
      name: "revu-ui",
      partialize: (state) => ({
        diffViewMode: state.diffViewMode,
        theme: state.theme,
        sidebarWidth: state.sidebarWidth,
        showCommentsPanel: state.showCommentsPanel,
        showFullFileContext: state.showFullFileContext,
        ignoreWhitespace: state.ignoreWhitespace,
        // Note: scrollToLine is intentionally not persisted
      }),
    },
  ),
);
