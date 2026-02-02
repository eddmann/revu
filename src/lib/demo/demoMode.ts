/**
 * Demo mode utilities for App Store / marketing screenshots.
 *
 * Usage:
 *   VITE_DEMO_MODE=withComments bun dev
 *
 * Available modes:
 *   - empty: No repo loaded
 *   - withChanges: Files with changes, one selected
 *   - withComments: Changes + review comments
 *   - staged: Files staged, commit panel ready
 *   - darkMode: withComments in dark theme
 */

export type DemoMode =
  | "empty"
  | "withChanges"
  | "withComments"
  | "staged"
  | "darkMode";

/**
 * Returns the current demo mode from environment variable.
 * Returns null if not in demo mode.
 */
export function getDemoMode(): DemoMode | null {
  const mode = import.meta.env.VITE_DEMO_MODE as string | undefined;
  if (!mode) return null;

  const validModes: DemoMode[] = [
    "empty",
    "withChanges",
    "withComments",
    "staged",
    "darkMode",
  ];

  if (validModes.includes(mode as DemoMode)) {
    return mode as DemoMode;
  }

  console.warn(`Invalid demo mode: ${mode}. Valid modes: ${validModes.join(", ")}`);
  return null;
}

/**
 * Check if currently running in demo mode.
 */
export function isDemoMode(): boolean {
  return getDemoMode() !== null;
}

/**
 * Whether the demo mode should show pre-populated comments.
 */
export function demoHasComments(mode: DemoMode | null): boolean {
  return mode === "withComments" || mode === "darkMode";
}

/**
 * Whether the demo mode should select a file by default.
 */
export function demoShouldSelectFile(mode: DemoMode | null): boolean {
  return mode !== null && mode !== "empty";
}

/**
 * Whether the demo mode should show dark theme.
 */
export function demoUsesDarkTheme(mode: DemoMode | null): boolean {
  return mode === "darkMode";
}

/**
 * Whether the demo mode should show staged files.
 */
export function demoShowsStaged(mode: DemoMode | null): boolean {
  return mode === "staged";
}
