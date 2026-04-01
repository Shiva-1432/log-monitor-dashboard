"use client";

import React, { useState } from "react";
import { ArchiverStatus } from "../../lib/api";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

interface StorageStatsProps {
  status: ArchiverStatus | null;
  loading: boolean;
}

/**
 * Calculates human readable relative time spans softly mapped to strings.
 */
function getRelativeTime(isoDate: string | null, isFuture = false): string {
  if (!isoDate) return "--";
  
  const now = Date.now();
  const target = new Date(isoDate).getTime();
  const diffMs = isFuture ? target - now : now - target;

  if (diffMs <= 0) return isFuture ? "run pending..." : "just now";
  if (diffMs < 60000) return isFuture ? "< 1m" : "just now";
  if (diffMs < 3600000) {
    const m = Math.floor(diffMs / 60000);
    return isFuture ? `${m}m` : `${m}m ago`;
  }
  
  const h = Math.floor(diffMs / 3600000);
  return isFuture ? `${h}h` : `${h}h ago`;
}

export default function StorageStats({ status, loading }: StorageStatsProps) {
  const [showErrors, setShowErrors] = useState(false);

  if (loading || !status) {
    return (
      <div className="flex flex-col gap-4 font-mono w-full">
        <div className="grid grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg bg-gray-900 border border-gray-800 h-[72px]"
            />
          ))}
        </div>
      </div>
    );
  }

  const {
    isRunning,
    lastArchivedAt,
    totalArchived,
    nextRunAt,
    intervalMinutes,
    errors = [],
  } = status;

  return (
    <div className="flex flex-col gap-4 font-mono w-full text-gray-300">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-5 gap-3">
        {/* Card 1: Status */}
        <div className="rounded-lg bg-gray-950 border border-gray-800 p-3 flex flex-col justify-center">
          <span className="text-[10px] uppercase text-gray-500 mb-1 tracking-wider">Status</span>
          <span className={`text-[15px] font-bold ${isRunning ? "text-emerald-500" : "text-rose-500"}`}>
            {isRunning ? "RUNNING" : "STOPPED"}
          </span>
        </div>

        {/* Card 2: Total Archived */}
        <div className="rounded-lg bg-gray-950 border border-gray-800 p-3 flex flex-col justify-center">
          <span className="text-[10px] uppercase text-gray-500 mb-1 tracking-wider">Total Archived</span>
          <span className="text-[15px] font-bold text-blue-400">
            {totalArchived.toLocaleString()}
          </span>
        </div>

        {/* Card 3: Last Saved */}
        <div className="rounded-lg bg-gray-950 border border-gray-800 p-3 flex flex-col justify-center">
          <span className="text-[10px] uppercase text-gray-500 mb-1 tracking-wider">Last Saved</span>
          <span className="text-[15px] font-bold text-gray-300">
            {getRelativeTime(lastArchivedAt, false)}
          </span>
        </div>

        {/* Card 4: Next Run */}
        <div className="rounded-lg bg-gray-950 border border-gray-800 p-3 flex flex-col justify-center">
          <span className="text-[10px] uppercase text-gray-500 mb-1 tracking-wider">Next Run</span>
          <span className="text-[15px] font-bold text-amber-500">
            {isRunning ? getRelativeTime(nextRunAt, true) : "--"}
          </span>
        </div>

        {/* Card 5: Interval */}
        <div className="rounded-lg bg-gray-950 border border-gray-800 p-3 flex flex-col justify-center">
          <span className="text-[10px] uppercase text-gray-500 mb-1 tracking-wider">Interval</span>
          <span className="text-[15px] font-bold text-gray-400">
            {intervalMinutes} min
          </span>
        </div>
      </div>

      {/* Error Section */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 overflow-hidden">
          <button
            onClick={() => setShowErrors(!showErrors)}
            className="flex items-center justify-between w-full px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} />
              {errors.length} recent error{errors.length !== 1 ? 's' : ''} reported
            </div>
            {showErrors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showErrors && (
            <div className="p-3 border-t border-rose-500/20 text-[11px] text-rose-400 flex flex-col gap-1.5">
              {/* Force slice at 5 just in case backend scaling passed > 5 */}
              {errors.slice(0, 5).map((err: any, idx) => {
                // If it's passed as a map with { time, message } or pure string:
                const errorStr = typeof err === 'object' ? `[${err.time || 'unknown'}] ${err.message}` : String(err);
                
                return (
                  <div key={idx} className="bg-black/20 rounded px-2 py-1.5 border border-rose-500/10 truncate">
                    {errorStr}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
