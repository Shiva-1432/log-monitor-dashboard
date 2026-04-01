"use client";

import { useEffect } from "react";

/**
 * Custom Next.js 14 Error Boundary
 * Prevents the application from "refreshing" infinitely by capturing
 * segment-level crashes and providing a manual reset.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an observability service in production
    console.error("[SEGMENT_ERROR]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center bg-[#0d0f14] text-[#e8ecf0]">
      <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      </div>
      <h2 className="text-xl font-bold mb-2">Something went wrong!</h2>
      <p className="text-sm text-[#94a3b8] mb-6 max-w-md">
        An error occurred in this dashboard segment.
        <br />
        <span className="font-mono text-[11px] opacity-70 italic">{error.message}</span>
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2 rounded-lg bg-[#00e5a0] text-[#0d0f14] font-bold hover:opacity-90 transition-all text-sm"
      >
        Try again
      </button>
    </div>
  );
}
