'use client';

// Minimal passthrough — next-themes not installed in dev
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
