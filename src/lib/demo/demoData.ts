/**
 * Demo data factory for App Store / marketing screenshots.
 * Only used when VITE_DEMO_MODE environment variable is set.
 */

import type {
  FileEntry,
  FileDiff,
  RepositoryStatus,
  DiffHunk,
} from '@/types/git';
import type { Comment } from '@/types/comment';

// Sample repository status with realistic file changes
export function createDemoStatus(): RepositoryStatus {
  return {
    path: '/Users/demo/projects/my-app',
    branch: 'feature/user-authentication',
    files: [
      { path: 'src/auth/AuthProvider.tsx', status: 'modified', staged: true },
      { path: 'src/auth/useAuth.ts', status: 'modified', staged: true },
      { path: 'src/components/LoginForm.tsx', status: 'added', staged: true },
      { path: 'src/hooks/useSession.ts', status: 'added', staged: true },
      { path: 'src/api/auth.ts', status: 'modified', staged: false },
      { path: 'src/types/user.ts', status: 'added', staged: false },
      { path: 'src/middleware/withAuth.ts', status: 'added', staged: false },
      { path: 'README.md', status: 'modified', staged: false },
    ],
    stagedCount: 4,
    unstagedCount: 4,
  };
}

// Sample diff for the selected file
export function createDemoFileDiff(file: FileEntry): FileDiff {
  const diffs: Record<string, FileDiff> = {
    'src/auth/AuthProvider.tsx': {
      path: 'src/auth/AuthProvider.tsx',
      status: 'modified',
      hunks: [
        {
          header: '@@ -1,12 +1,18 @@',
          oldStart: 1,
          oldLines: 12,
          newStart: 1,
          newLines: 18,
          lines: [
            {
              lineType: 'context',
              content:
                "import React, { createContext, useContext, useState, useEffect } from 'react';",
              oldLineNo: 1,
              newLineNo: 1,
            },
            {
              lineType: 'deletion',
              content: "import { User } from '../types';",
              oldLineNo: 2,
            },
            {
              lineType: 'addition',
              content: "import { User, AuthState } from '../types/user';",
              newLineNo: 2,
            },
            {
              lineType: 'addition',
              content: "import { authApi } from '../api/auth';",
              newLineNo: 3,
            },
            { lineType: 'context', content: '', oldLineNo: 3, newLineNo: 4 },
            {
              lineType: 'context',
              content: 'interface AuthContextType {',
              oldLineNo: 4,
              newLineNo: 5,
            },
            {
              lineType: 'context',
              content: '  user: User | null;',
              oldLineNo: 5,
              newLineNo: 6,
            },
            {
              lineType: 'deletion',
              content: '  login: (email: string, password: string) => void;',
              oldLineNo: 6,
            },
            {
              lineType: 'addition',
              content:
                '  login: (email: string, password: string) => Promise<void>;',
              newLineNo: 7,
            },
            {
              lineType: 'addition',
              content: '  logout: () => Promise<void>;',
              newLineNo: 8,
            },
            {
              lineType: 'addition',
              content: '  isLoading: boolean;',
              newLineNo: 9,
            },
            { lineType: 'context', content: '}', oldLineNo: 7, newLineNo: 10 },
            { lineType: 'context', content: '', oldLineNo: 8, newLineNo: 11 },
            {
              lineType: 'context',
              content:
                'const AuthContext = createContext<AuthContextType | undefined>(undefined);',
              oldLineNo: 9,
              newLineNo: 12,
            },
          ],
        },
        {
          header: '@@ -25,8 +31,24 @@',
          oldStart: 25,
          oldLines: 8,
          newStart: 31,
          newLines: 24,
          lines: [
            {
              lineType: 'context',
              content:
                'export function AuthProvider({ children }: { children: React.ReactNode }) {',
              oldLineNo: 25,
              newLineNo: 31,
            },
            {
              lineType: 'context',
              content: '  const [user, setUser] = useState<User | null>(null);',
              oldLineNo: 26,
              newLineNo: 32,
            },
            {
              lineType: 'addition',
              content: '  const [isLoading, setIsLoading] = useState(true);',
              newLineNo: 33,
            },
            { lineType: 'context', content: '', oldLineNo: 27, newLineNo: 34 },
            {
              lineType: 'deletion',
              content: '  const login = (email: string, password: string) => {',
              oldLineNo: 28,
            },
            {
              lineType: 'deletion',
              content: '    // TODO: Implement actual authentication',
              oldLineNo: 29,
            },
            {
              lineType: 'deletion',
              content: "    setUser({ id: '1', email, name: 'User' });",
              oldLineNo: 30,
            },
            {
              lineType: 'addition',
              content:
                '  const login = async (email: string, password: string) => {',
              newLineNo: 35,
            },
            {
              lineType: 'addition',
              content: '    setIsLoading(true);',
              newLineNo: 36,
            },
            { lineType: 'addition', content: '    try {', newLineNo: 37 },
            {
              lineType: 'addition',
              content:
                '      const response = await authApi.login(email, password);',
              newLineNo: 38,
            },
            {
              lineType: 'addition',
              content: '      setUser(response.user);',
              newLineNo: 39,
            },
            { lineType: 'addition', content: '    } finally {', newLineNo: 40 },
            {
              lineType: 'addition',
              content: '      setIsLoading(false);',
              newLineNo: 41,
            },
            { lineType: 'addition', content: '    }', newLineNo: 42 },
            {
              lineType: 'context',
              content: '  };',
              oldLineNo: 31,
              newLineNo: 43,
            },
            { lineType: 'context', content: '', oldLineNo: 32, newLineNo: 44 },
            {
              lineType: 'addition',
              content: '  const logout = async () => {',
              newLineNo: 45,
            },
            {
              lineType: 'addition',
              content: '    await authApi.logout();',
              newLineNo: 46,
            },
            {
              lineType: 'addition',
              content: '    setUser(null);',
              newLineNo: 47,
            },
            { lineType: 'addition', content: '  };', newLineNo: 48 },
            { lineType: 'addition', content: '', newLineNo: 49 },
          ],
        },
      ],
      isBinary: false,
      language: 'tsx',
    },
    'src/api/auth.ts': {
      path: 'src/api/auth.ts',
      status: 'modified',
      hunks: [
        {
          header: '@@ -1,4 +1,7 @@',
          oldStart: 1,
          oldLines: 4,
          newStart: 1,
          newLines: 7,
          lines: [
            {
              lineType: 'context',
              content: "import type { LoginResponse } from '../types/user';",
              oldLineNo: 1,
              newLineNo: 1,
            },
            {
              lineType: 'addition',
              content: "import type { TokenPair, User } from '../types/user';",
              newLineNo: 2,
            },
            { lineType: 'context', content: '', oldLineNo: 2, newLineNo: 3 },
            {
              lineType: 'deletion',
              content: 'const API_URL = process.env.API_URL;',
              oldLineNo: 3,
            },
            {
              lineType: 'addition',
              content: 'const API_URL = import.meta.env.VITE_API_URL;',
              newLineNo: 4,
            },
            {
              lineType: 'addition',
              content: "const TOKEN_KEY = 'auth_token';",
              newLineNo: 5,
            },
            {
              lineType: 'addition',
              content: "const REFRESH_KEY = 'refresh_token';",
              newLineNo: 6,
            },
            { lineType: 'context', content: '', oldLineNo: 4, newLineNo: 7 },
          ],
        },
        {
          header: '@@ -5,3 +8,20 @@',
          oldStart: 5,
          oldLines: 3,
          newStart: 8,
          newLines: 20,
          lines: [
            {
              lineType: 'context',
              content: 'export const authApi = {',
              oldLineNo: 5,
              newLineNo: 8,
            },
            {
              lineType: 'deletion',
              content: '  // TODO: implement auth methods',
              oldLineNo: 6,
            },
            {
              lineType: 'addition',
              content:
                '  async login(email: string, password: string): Promise<LoginResponse> {',
              newLineNo: 9,
            },
            {
              lineType: 'addition',
              content:
                '    const response = await fetch(`${API_URL}/auth/login`, {',
              newLineNo: 10,
            },
            {
              lineType: 'addition',
              content: "      method: 'POST',",
              newLineNo: 11,
            },
            {
              lineType: 'addition',
              content: "      headers: { 'Content-Type': 'application/json' },",
              newLineNo: 12,
            },
            {
              lineType: 'addition',
              content: '      body: JSON.stringify({ email, password }),',
              newLineNo: 13,
            },
            { lineType: 'addition', content: '    });', newLineNo: 14 },
            {
              lineType: 'addition',
              content: "    if (!response.ok) throw new Error('Login failed');",
              newLineNo: 15,
            },
            {
              lineType: 'addition',
              content: '    const data = await response.json();',
              newLineNo: 16,
            },
            {
              lineType: 'addition',
              content: '    localStorage.setItem(TOKEN_KEY, data.tokens.access);',
              newLineNo: 17,
            },
            {
              lineType: 'addition',
              content:
                '    localStorage.setItem(REFRESH_KEY, data.tokens.refresh);',
              newLineNo: 18,
            },
            {
              lineType: 'addition',
              content: '    return data;',
              newLineNo: 19,
            },
            { lineType: 'addition', content: '  },', newLineNo: 20 },
            { lineType: 'addition', content: '', newLineNo: 21 },
            {
              lineType: 'addition',
              content: '  async logout(): Promise<void> {',
              newLineNo: 22,
            },
            {
              lineType: 'addition',
              content:
                "    await fetch(`${API_URL}/auth/logout`, { method: 'POST' });",
              newLineNo: 23,
            },
            {
              lineType: 'addition',
              content: '    localStorage.removeItem(TOKEN_KEY);',
              newLineNo: 24,
            },
            {
              lineType: 'addition',
              content: '    localStorage.removeItem(REFRESH_KEY);',
              newLineNo: 25,
            },
            { lineType: 'addition', content: '  },', newLineNo: 26 },
            {
              lineType: 'context',
              content: '};',
              oldLineNo: 7,
              newLineNo: 27,
            },
          ],
        },
      ],
      isBinary: false,
      language: 'ts',
    },
  };

  // Return the specific diff or a generic one
  return diffs[file.path] || createGenericDiff(file);
}

function createGenericDiff(file: FileEntry): FileDiff {
  const hunks: DiffHunk[] =
    file.status === 'added'
      ? [
          {
            header: '@@ -0,0 +1,10 @@',
            oldStart: 0,
            oldLines: 0,
            newStart: 1,
            newLines: 10,
            lines: [
              {
                lineType: 'addition',
                content: '// New file added',
                newLineNo: 1,
              },
              { lineType: 'addition', content: '', newLineNo: 2 },
              {
                lineType: 'addition',
                content: 'export interface User {',
                newLineNo: 3,
              },
              { lineType: 'addition', content: '  id: string;', newLineNo: 4 },
              {
                lineType: 'addition',
                content: '  email: string;',
                newLineNo: 5,
              },
              {
                lineType: 'addition',
                content: '  name: string;',
                newLineNo: 6,
              },
              { lineType: 'addition', content: '}', newLineNo: 7 },
            ],
          },
        ]
      : [
          {
            header: '@@ -1,5 +1,8 @@',
            oldStart: 1,
            oldLines: 5,
            newStart: 1,
            newLines: 8,
            lines: [
              {
                lineType: 'context',
                content: '# My App',
                oldLineNo: 1,
                newLineNo: 1,
              },
              { lineType: 'context', content: '', oldLineNo: 2, newLineNo: 2 },
              {
                lineType: 'deletion',
                content: 'A simple application.',
                oldLineNo: 3,
              },
              {
                lineType: 'addition',
                content: 'A full-featured application with authentication.',
                newLineNo: 3,
              },
              { lineType: 'addition', content: '', newLineNo: 4 },
              { lineType: 'addition', content: '## Features', newLineNo: 5 },
              {
                lineType: 'addition',
                content: '- User authentication',
                newLineNo: 6,
              },
              { lineType: 'context', content: '', oldLineNo: 4, newLineNo: 7 },
            ],
          },
        ];

  return {
    path: file.path,
    status: file.status,
    hunks,
    isBinary: false,
    language: file.path.endsWith('.ts')
      ? 'ts'
      : file.path.endsWith('.tsx')
      ? 'tsx'
      : undefined,
  };
}

// Sample comments for demo mode
export function createDemoComments(): Record<string, Comment[]> {
  const now = Date.now();

  return {
    'src/auth/AuthProvider.tsx': [
      {
        id: 'demo-1',
        filePath: 'src/auth/AuthProvider.tsx',
        startLine: 38,
        endLine: 38,
        content:
          'The error from authApi.login is being silently ignored. This could make debugging difficult.',
        category: 'issue',
        codeSnippet:
          '      const response = await authApi.login(email, password);',
        createdAt: now - 200000,
        isOld: false,
      },
    ],
    'src/api/auth.ts': [
      {
        id: 'demo-2',
        filePath: 'src/api/auth.ts',
        startLine: 15,
        endLine: 15,
        content:
          'Should we include more specific error messages based on the response status code?',
        category: 'question',
        codeSnippet: "    if (!response.ok) throw new Error('Login failed');",
        createdAt: now - 120000,
        isOld: false,
      },
      {
        id: 'demo-3',
        filePath: 'src/api/auth.ts',
        startLine: 17,
        endLine: 18,
        content:
          'Consider using httpOnly cookies instead of localStorage for tokens — localStorage is vulnerable to XSS attacks.',
        category: 'suggestion',
        codeSnippet:
          '    localStorage.setItem(TOKEN_KEY, data.tokens.access);\n    localStorage.setItem(REFRESH_KEY, data.tokens.refresh);',
        createdAt: now - 50000,
        isOld: false,
      },
    ],
  };
}

// Get all demo comments as flat array
export function getAllDemoComments(): Comment[] {
  const commentsByFile = createDemoComments();
  return Object.values(commentsByFile)
    .flat()
    .sort((a, b) => {
      if (a.filePath !== b.filePath)
        return a.filePath.localeCompare(b.filePath);
      return a.startLine - b.startLine;
    });
}

// Build complete demo state for gitStore initialization
export function buildDemoGitState() {
  const status = createDemoStatus();
  const diffs: Record<string, FileDiff> = {};

  // Pre-build all diffs for all files
  for (const file of status.files) {
    diffs[file.path] = createDemoFileDiff(file);
  }

  return { status, diffs };
}
