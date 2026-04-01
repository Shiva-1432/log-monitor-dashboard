"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import clsx from "clsx";

interface ErrorBannerProps {
  error: string | null;
  onDismiss?: () => void;
}

export default function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 10000); // 10s auto-dismiss
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [error]);

  if (!error || !visible) return null;

  // Intelligent Message Mapping
  let displayMessage = error;
  if (error.includes("Failed to fetch") || error.includes("NetworkError")) {
    displayMessage = "Backend unreachable — check if your Render service or Express server is running.";
  } else if (error.includes("401") || error.includes("Unauthorized")) {
    displayMessage = "Session expired or unauthorized — please try re-logging in.";
  } else if (error.includes("429") || error.includes("Too Many Requests")) {
    displayMessage = "Rate limit reached — please wait 60 seconds before trying again.";
  } else if (error.includes("503")) {
    displayMessage = "Backend is waking up (Render cold start) — please wait a moment.";
  }

  return (
    <div className={clsx(
      "w-full bg-[#ff4757]/10 border border-[#ff4757]/30 rounded-lg p-4 flex items-center justify-between gap-3 text-[#ff4757] font-mono text-xs animate-in fade-in slide-in-from-top-2 duration-300 mb-4",
    )}>
      <div className="flex items-center gap-3">
        <AlertCircle size={18} className="flex-shrink-0" />
        <div>
          <span className="font-bold mr-2 tracking-tight">⚠ SYSTEM ERROR:</span>
          <span>{displayMessage}</span>
        </div>
      </div>

      {onDismiss && (
        <button 
          onClick={() => { setVisible(false); onDismiss(); }}
          className="p-1 hover:bg-[#ff4757]/20 rounded-md transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
