"use client";

import { useEffect } from "react";

/**
 * Root-Level Global Error Boundary
 * This is strictly required by Next.js 14 to catch errors in the Root Layout.
 * It must include <html> and <body> and handles the total dashboard crash state.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GLOBAL_CRITICAL_ERROR]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#0d0f14] text-[#e8ecf0]">
        <div className="flex h-screen flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="9" x2="15" y2="15" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-3 tracking-tight">LogWatch Critical Failure</h1>
          <p className="text-[#94a3b8] mb-8 max-w-sm">
            The core application layout has encountered a fatal error.
            <br />
            <span className="font-mono text-[11px] opacity-70 italic">{error.message}</span>
          </p>
          <button
            onClick={() => {
              // Clear session and attempt full reload
              window.location.href = "/";
            }}
            className="px-8 py-3 rounded-lg bg-[#00e5a0] text-[#0d0f14] font-bold hover:opacity-90 transition-all text-sm uppercase tracking-wider"
          >
            Full Re-launch
          </button>
        </div>
      </body>
    </html>
  );
}
