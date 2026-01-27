import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { FileEntry, FileDiff, RepositoryStatus } from "@/types/git";

interface GitState {
  repoPath: string | null;
  status: RepositoryStatus | null;
  selectedFile: FileEntry | null;
  currentDiff: FileDiff | null;
  isLoading: boolean;
  error: string | null;

  setRepoPath: (path: string) => Promise<void>;
  refreshStatus: () => Promise<void>;
  selectFile: (
    file: FileEntry | null,
    fullContext?: boolean,
    ignoreWhitespace?: boolean,
  ) => Promise<void>;
  fetchDiff: (fullContext: boolean, ignoreWhitespace: boolean) => Promise<void>;
  stageFile: (filePath: string) => Promise<void>;
  unstageFile: (filePath: string) => Promise<void>;
  stageAll: () => Promise<void>;
  unstageAll: () => Promise<void>;
  commit: (message: string) => Promise<string>;
  discardFile: (filePath: string) => Promise<void>;
  discardAll: () => Promise<void>;
  clearError: () => void;
}

export const useGitStore = create<GitState>()((set, get) => ({
  repoPath: null,
  status: null,
  selectedFile: null,
  currentDiff: null,
  isLoading: false,
  error: null,

  setRepoPath: async (path: string) => {
    set({ repoPath: path, isLoading: true, error: null });
    try {
      const status = await invoke<RepositoryStatus>("get_status", {
        repoPath: path,
      });
      set({ status, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  refreshStatus: async () => {
    const { repoPath } = get();
    if (!repoPath) return;

    set({ isLoading: true, error: null });
    try {
      const status = await invoke<RepositoryStatus>("get_status", { repoPath });
      set({ status, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  selectFile: async (
    file: FileEntry | null,
    fullContext = false,
    ignoreWhitespace = false,
  ) => {
    const { repoPath } = get();
    if (!repoPath) return;

    set({ selectedFile: file, currentDiff: null });

    if (file) {
      try {
        const diff = await invoke<FileDiff>("get_file_diff", {
          repoPath,
          filePath: file.path,
          staged: file.staged,
          contextLines: fullContext ? 999999 : null,
          ignoreWhitespace: ignoreWhitespace || null,
        });
        set({ currentDiff: diff });
      } catch (e) {
        set({ error: String(e) });
      }
    }
  },

  fetchDiff: async (fullContext: boolean, ignoreWhitespace: boolean) => {
    const { repoPath, selectedFile } = get();
    if (!repoPath || !selectedFile) return;

    try {
      const diff = await invoke<FileDiff>("get_file_diff", {
        repoPath,
        filePath: selectedFile.path,
        staged: selectedFile.staged,
        contextLines: fullContext ? 999999 : null,
        ignoreWhitespace: ignoreWhitespace || null,
      });
      set({ currentDiff: diff });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  stageFile: async (filePath: string) => {
    const { repoPath, refreshStatus, selectFile, selectedFile } = get();
    if (!repoPath) return;

    try {
      await invoke("stage_file", { repoPath, filePath });
      await refreshStatus();
      if (selectedFile?.path === filePath) {
        const newStatus = get().status;
        const newFile = newStatus?.files.find(
          (f) => f.path === filePath && f.staged,
        );
        if (newFile) await selectFile(newFile);
      }
    } catch (e) {
      set({ error: String(e) });
    }
  },

  unstageFile: async (filePath: string) => {
    const { repoPath, refreshStatus, selectFile, selectedFile } = get();
    if (!repoPath) return;

    try {
      await invoke("unstage_file", { repoPath, filePath });
      await refreshStatus();
      if (selectedFile?.path === filePath) {
        const newStatus = get().status;
        const newFile = newStatus?.files.find(
          (f) => f.path === filePath && !f.staged,
        );
        if (newFile) await selectFile(newFile);
      }
    } catch (e) {
      set({ error: String(e) });
    }
  },

  stageAll: async () => {
    const { repoPath, refreshStatus } = get();
    if (!repoPath) return;

    try {
      await invoke("stage_all", { repoPath });
      await refreshStatus();
    } catch (e) {
      set({ error: String(e) });
    }
  },

  unstageAll: async () => {
    const { repoPath, refreshStatus } = get();
    if (!repoPath) return;

    try {
      await invoke("unstage_all", { repoPath });
      await refreshStatus();
    } catch (e) {
      set({ error: String(e) });
    }
  },

  commit: async (message: string) => {
    const { repoPath, refreshStatus } = get();
    if (!repoPath) throw new Error("No repository");

    const oid = await invoke<string>("commit", { repoPath, message });
    await refreshStatus();
    set({ selectedFile: null, currentDiff: null });
    return oid;
  },

  discardFile: async (filePath: string) => {
    const { repoPath, refreshStatus, selectedFile } = get();
    if (!repoPath) return;

    try {
      await invoke("discard_file", { repoPath, filePath });
      await refreshStatus();
      if (selectedFile?.path === filePath) {
        set({ selectedFile: null, currentDiff: null });
      }
    } catch (e) {
      set({ error: String(e) });
    }
  },

  discardAll: async () => {
    const { repoPath, refreshStatus } = get();
    if (!repoPath) return;

    try {
      await invoke("discard_all", { repoPath });
      await refreshStatus();
      set({ selectedFile: null, currentDiff: null });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  clearError: () => set({ error: null }),
}));
