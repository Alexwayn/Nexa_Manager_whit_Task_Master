// Local shim for @stagewise/toolbar
// Provides a no-op implementation so the app can run without the external dev tool installed.

export type StagewiseConfig = {
  plugins?: unknown[];
};

export function initToolbar(_config?: StagewiseConfig): void {
  if (import.meta.env.DEV) {
    // Keep this quiet to avoid noisy logs, but leave a comment for maintainers.
    // console.warn('Stagewise Toolbar shim active - real package not installed.');
  }
}