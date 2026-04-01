"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLogStream } from "../../hooks/useLogStream";
import type { LogEntry } from "../../lib/types";
import { AlertTriangle, Wifi, WifiOff, RefreshCcw, Play, Pause, Trash2 } from "lucide-react";

interface LiveLogFeedProps {
  maxVisible?: number;
  wsUrl?: string;
  autoScroll?: boolean;
  onConnectionChange?: (connected: boolean) => void;
}

export default function LiveLogFeed({
  maxVisible = 50,
  wsUrl,
  autoScroll = true,
  onConnectionChange,
}: LiveLogFeedProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [waitingCount, setWaitingCount] = useState(0);
  const [displayedLogs, setDisplayedLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(isPaused);

  const {
    logs,
    newLogIds,
    connected,
    connectionType,
    error,
    clearLogs,
    pause: hookPause,
    resume: hookResume
  } = useLogStream({
    maxLogs: 200, // Keep a larger background buffer off-screen
    wsUrl,
    enabled: true, // Always keep the network physically active
    onNewLog: () => {
      // Increment the "new logs waiting" counter only if the UI is paused
      if (isPausedRef.current) {
        setWaitingCount((c) => c + 1);
      }
    },
  });

  // Sync state cleanly into the screen unless frozen
  useEffect(() => {
    isPausedRef.current = isPaused;
    if (!isPaused) {
      setWaitingCount(0);
      setDisplayedLogs(logs.slice(0, maxVisible));
      
      // Auto-jump to the newest item perfectly
      if (autoScroll && scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    }
  }, [isPaused, logs, maxVisible, autoScroll]);

  // Sync connection state up to parent
  useEffect(() => {
    if (onConnectionChange) {
      onConnectionChange(connected);
    }
  }, [connected, onConnectionChange]);

  const handleClear = () => {
    clearLogs();
    setDisplayedLogs([]);
    setWaitingCount(0);
  };

  const handleTogglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const handleForceReconnect = () => {
    // Toggling the hook's native enabled wrapper safely drops and re-establishes streams
    hookPause();
    setTimeout(() => hookResume(), 100);
  };

  // 1. Connection Status Bar Mapping
  let statusColor = "bg-rose-500";
  let statusText = "disconnected";
  let pulse = false;

  if (connectionType === "websocket") {
    statusColor = "bg-emerald-500";
    statusText = "LIVE · websocket";
    pulse = true;
  } else if (connectionType === "sse") {
    statusColor = "bg-amber-500";
    statusText = "LIVE ·  SSE polling";
    pulse = true;
  } else {
    statusText = "disconnected — reconnecting...";
  }

  const isFatalError = error?.includes("AWS Pulse Check");

  return (
    <div className="flex flex-col rounded-lg border border-gray-800 bg-gray-950 font-mono text-gray-300 shadow-xl overflow-hidden w-full">
      
      {/* Fallback standard CSS for pure 200ms entry animations without plugin deps */}
      <style>{`
        @keyframes slideInFade {
          0% { opacity: 0; transform: translateY(-8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* 1. Header Bar */}
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            {pulse && (
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${statusColor}`}></span>
            )}
            <span className={`relative inline-flex h-3 w-3 rounded-full ${statusColor}`}></span>
          </div>
          <span className="text-sm font-semibold tracking-wide text-gray-100">
            {statusText}
          </span>
        </div>

        <div className="text-xs text-gray-400">
          {logs.length} logs · {waitingCount > 0 ? (
            <span className="text-emerald-400 font-bold">{waitingCount} new</span>
          ) : (
            `${newLogIds.size} recent`
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePause}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              isPaused 
                ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" 
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            {isPaused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 rounded-md bg-transparent px-2.5 py-1 text-xs font-medium text-gray-400 transition-colors hover:bg-rose-500/20 hover:text-rose-400"
          >
            <Trash2 size={14} />
            Clear
          </button>
        </div>
      </div>

      {/* Disconnected / Error Banners */}
      {!connected && !isFatalError && (
        <div className="flex w-full items-center justify-center gap-2 bg-amber-500/10 px-4 py-2 text-sm text-amber-500 border-b border-amber-500/20">
          <WifiOff size={16} />
          ⚠ stream disconnected — {error || "attempting reconnect..."}
        </div>
      )}

      {isFatalError && (
        <div className="flex w-full items-center justify-between bg-rose-500/10 px-4 py-2 text-sm text-rose-500 border-b border-rose-500/20">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <strong>Stream Offline:</strong> {error}
          </div>
          <button
            onClick={handleForceReconnect}
            className="flex items-center gap-1.5 rounded-md bg-rose-500 px-3 py-1 text-xs font-bold text-white hover:bg-rose-600 transition-colors"
          >
            <RefreshCcw size={14} /> Reconnect
          </button>
        </div>
      )}

      {/* 2. Log Stream Window Area */}
      <div className="relative">
        
        {/* Sticky Paused Banner */}
        {isPaused && (
          <div className="absolute top-0 left-0 right-0 z-10 flex w-full items-center justify-center bg-gray-900/90 py-1.5 text-xs font-medium text-emerald-400 backdrop-blur border-b border-gray-800 shadow-xl">
            ⏸ paused — {waitingCount} new log{waitingCount !== 1 ? 's' : ''} buffered
          </div>
        )}

        <div
          ref={scrollRef}
          className="h-[400px] w-full overflow-y-auto overflow-x-hidden pt-1 pb-2 px-2 scroll-smooth"
        >
          {displayedLogs.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-600">
              Waiting for incoming log telemetry...
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {displayedLogs.map((log) => {
                const isNew = newLogIds.has(log.id);
                
                let rowBg = isNew ? "bg-emerald-500/10" : "bg-transparent hover:bg-gray-800/40";
                let rowBorder = isNew ? "border-l-emerald-500" : "border-l-transparent";
                
                let levelBadgeColor = "bg-blue-500/20 text-blue-400";
                let msgColor = "text-gray-300";

                if (log.level === "ERROR") {
                  levelBadgeColor = "bg-rose-500/20 text-rose-400";
                  msgColor = "text-rose-400"; // Red-tinted text completely
                } else if (log.level === "WARN") {
                  levelBadgeColor = "bg-amber-500/20 text-amber-400";
                  msgColor = "text-amber-400"; // Amber-tinted text
                }

                return (
                  <div
                    key={log.id}
                    className={`flex items-start gap-4 border-l-[3px] py-2 px-3 text-xs transition-colors duration-200 ${rowBg} ${rowBorder} rounded-r`}
                    style={isNew && !isPaused ? { animation: 'slideInFade 200ms ease-out forwards' } : {}}
                  >
                    {/* Time */}
                    <div className="w-20 shrink-0 text-gray-500">
                      {log.time}
                    </div>

                    {/* Level Badge */}
                    <div className={`w-14 shrink-0 rounded px-1 text-center text-[10px] font-bold tracking-wider leading-relaxed ${levelBadgeColor}`}>
                      {log.level}
                    </div>

                    {/* Endpoint */}
                    <div className="w-24 shrink-0 truncate text-gray-400">
                      {log.endpoint}
                    </div>

                    {/* Message */}
                    <div className={`flex-1 break-words ${msgColor}`}>
                      {log.message}
                    </div>

                    {/* Latency */}
                    <div className="w-16 shrink-0 text-right text-gray-500">
                      {log.latencyMs}ms
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
