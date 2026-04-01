"use client";

import React, { useState, useEffect } from "react";
import clsx from "clsx";
import type { Alert } from "@/lib/api";

interface AlertCardProps {
  alert: Alert;
  onDismiss: (id: string, timestamp: number) => void;
}

// Helper for relative time ("2m ago")
function getRelativeTime(timestamp: number) {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

// Severity Badge
function SeverityBadge({ severity }: { severity: Alert["severity"] }) {
  const colors = {
    critical: "bg-[#ff4757]/10 text-[#ff4757] border-[#ff4757]/20",
    warning: "bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/20",
    info: "bg-[#4d9fff]/10 text-[#4d9fff] border-[#4d9fff]/20",
  };

  return (
    <span
      className={clsx(
        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
        colors[severity]
      )}
    >
      {severity}
    </span>
  );
}

// Type Badge
function TypeBadge({ type }: { type: Alert["type"] }) {
  if (type === "ERROR_SPIKE") {
    return (
      <span className="bg-red-900/30 text-red-400 border border-red-900/50 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider inline-flex items-center gap-1">
        <span>⚡</span> ERROR_SPIKE
      </span>
    );
  }
  return (
    <span className="bg-amber-900/30 text-amber-400 border border-amber-900/50 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider inline-flex items-center gap-1">
      <span>⏱</span> HIGH_LATENCY
    </span>
  );
}

export default function AlertCard({ alert, onDismiss }: AlertCardProps) {
  const [isDismissing, setIsDismissing] = useState(false);
  const [relativeTime, setRelativeTime] = useState(getRelativeTime(alert.timestamp));

  // Update relative time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTime(getRelativeTime(alert.timestamp));
    }, 60000);
    return () => clearInterval(interval);
  }, [alert.timestamp]);

  const handleDismiss = () => {
    setIsDismissing(true);
    // Show confirmation text for 1s, then trigger actual dismiss
    setTimeout(() => {
      onDismiss(alert.id, alert.timestamp);
    }, 1000);
  };

  // Border color based on severity
  const borderColor = {
    critical: "border-l-[#ff4757]",
    warning: "border-l-[#f5a623]",
    info: "border-l-[#4d9fff]",
  }[alert.severity] || "border-l-[#3b4354]";

  // Progress Bar logic
  const value = alert.type === "ERROR_SPIKE" ? alert.errorRate : alert.latencyP95;
  const fillPercent = Math.min((value / alert.threshold) * 100, 100);
  
  // Color scale for the mini bar
  let barFillColor = "bg-[#00e5a0]"; // Green safe
  if (value > alert.threshold) {
    barFillColor = "bg-[#ff4757]"; // Red over
  } else if (value >= alert.threshold * 0.8) {
    barFillColor = "bg-[#f5a623]"; // Amber warning (within 20%)
  }

  return (
    <div
      className={clsx(
        "bg-[#161a23] border border-[#222733] border-l-[3px] rounded-md p-4 font-mono transition-opacity duration-300 relative group overflow-hidden",
        borderColor,
        isDismissing && "opacity-50 pointer-events-none"
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        
        {/* Main Content Area */}
        <div className="flex-1 space-y-3">
          
          {/* Header Row */}
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={alert.severity} />
            <TypeBadge type={alert.type} />
            <h3 className="text-white font-medium text-sm ml-1 truncate max-w-full sm:max-w-md">
              {alert.title}
            </h3>
            <span className="text-[#8a9bb3] text-xs ml-auto whitespace-nowrap hidden sm:inline-block">
              {relativeTime}
            </span>
          </div>

          {/* Description */}
          <p className="text-[#8a9bb3] text-sm leading-relaxed max-w-3xl">
            {alert.description}
          </p>

          {/* Metrics Row & Mini Bar */}
          <div className="bg-[#0d0f14] p-3 rounded border border-[#222733] flex flex-col md:flex-row items-center gap-4 text-xs">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[#8a9bb3]">
              <span className="text-white min-w-max">{alert.endpoint}</span>
              
              {alert.type === "ERROR_SPIKE" ? (
                <>
                  <span>Rate: <span className="text-white">{alert.errorRate}%</span></span>
                  <span>Threshold: <span className="text-white">{alert.threshold}%</span></span>
                </>
              ) : (
                <>
                  <span>P95: <span className="text-white">{alert.latencyP95}ms</span></span>
                  <span>Threshold: <span className="text-white">{alert.threshold}ms</span></span>
                </>
              )}
              
              <span>Samples: <span className="text-white">{alert.sampleSize}</span></span>
            </div>

            {/* Mini Progress Bar */}
            <div className="w-full md:w-32 h-1.5 bg-[#222733] rounded-full overflow-hidden shrink-0 mt-2 md:mt-0 ml-auto">
              <div
                className={clsx("h-full transition-all duration-500", barFillColor)}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Area (Right Side) */}
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 self-stretch border-t border-[#222733] sm:border-t-0 pt-3 sm:pt-0">
          <span className="text-[#8a9bb3] text-xs sm:hidden block">
            {relativeTime}
          </span>
          
          {isDismissing ? (
            <span className="text-[#00e5a0] text-xs animate-pulse whitespace-nowrap">
              ✓ Dismissed
            </span>
          ) : (
            <button
              onClick={handleDismiss}
              className="text-[#8a9bb3] hover:text-white bg-[#0d0f14] hover:bg-[#222733] border border-[#222733] rounded px-3 py-1 text-xs transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
