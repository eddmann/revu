/**
 * Demo mode entry point - only imported dynamically in development.
 * This entire module tree is excluded from production builds.
 */

export { getDemoMode, isDemoMode, demoHasComments, demoUsesDarkTheme } from "./demoMode";
export type { DemoMode } from "./demoMode";
export {
  createDemoStatus,
  createDemoFileDiff,
  createDemoComments,
  buildDemoGitState,
} from "./demoData";
