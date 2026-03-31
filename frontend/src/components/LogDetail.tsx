"use client";

import React, { useEffect, useState, useCallback } from "react";
import clsx from "clsx";
import { X, Copy, Check } from "lucide-react";
import { LevelBadge } from "./ui/badges";
import type { LogEntry } from "@/lib/types";

export type { LogEntry };

interface LogDetailProps {
  log: LogEntry | null;
  onClose: () => void;
}

// ── Syntax-highlight raw JSON ────────────────────────────────────────────────
function syntaxHighlight(json: string): string {
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            // key
            return `<span class="text-blue-300">${match}</span>`;
          }
          // string value
          return `<span class="text-[#00e5a0]">${match}</span>`;
        }
        if (/true|false/.test(match)) {
          return `<span class="text-amber">${match}</span>`;
        }
        if (/null/.test(match)) {
          return `<span class="text-slate-500">${match}</span>`;
        }
        // number
        return `<span class="text-purple">${match}</span>`;
      }
    );
}

// ── Status code color ────────────────────────────────────────────────────────
function statusColor(code: number) {
  if (code >= 500) return "text-red";
  if (code >= 400) return "text-amber";
  return "text-green";
}

// ── Latency helpers ──────────────────────────────────────────────────────────
function latencyBarColor(ms: number) {
  if (ms > 1000) return "bg-red";
  if (ms > 500) return "bg-amber";
  return "bg-green";
}

function latencyTextColor(ms: number) {
  if (ms > 1000) return "text-red";
  if (ms > 500) return "text-amber";
  return "text-green";
}

function latencyPercent(ms: number) {
  return Math.min(100, (ms / 2000) * 100);
}

// ── Pretty-print raw JSON (best-effort) ─────────────────────────────────────
function prettyRaw(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export function LogDetail({ log, onClose }: LogDetailProps) {
  const [copied, setCopied] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Reset copied state whenever a new log is shown
  useEffect(() => {
    setCopied(false);
  }, [log?.id]);

  const handleCopy = () => {
    if (!log) return;
    navigator.clipboard.writeText(prettyRaw(log.raw)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (!log) return null;

  const pretty = prettyRaw(log.raw);
  const highlighted = syntaxHighlight(pretty);

  const metadata: { label: string; value: React.ReactNode }[] = [
    { label: "Request ID",   value: <span className="text-slate-300 break-all">{log.requestId}</span> },
    { label: "ISO Time",     value: <span className="text-slate-300">{log.isoTime}</span> },
    { label: "Endpoint",     value: <span className="text-slate-300">{log.endpoint}</span> },
    {
      label: "Status Code",
      value: <span className={clsx("font-bold", statusColor(log.statusCode))}>{log.statusCode}</span>,
    },
    { label: "Latency",      value: <span className="text-slate-300">{log.latencyMs} ms</span> },
    { label: "Region",       value: <span className="text-slate-300">{log.region}</span> },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="fixed right-0 top-0 z-50 h-screen w-[420px] bg-bg border-l border-border shadow-2xl flex flex-col font-mono text-slate-300 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Log Detail"
      >
        {/* ── Header ───────────────────────────────────────────── */}
        <header className="flex items-center justify-between px-5 py-4 bg-bg-2 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <LevelBadge level={log.level} />
            <span className="text-sm font-semibold text-white truncate">{log.endpoint}</span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors shrink-0 ml-3 group"
          >
            <X className="w-4 h-4 group-hover:text-red transition-colors" />
            <kbd className="text-[10px] bg-bg-3 border border-border rounded px-1 py-0.5 font-sans tracking-wide">
              ESC
            </kbd>
          </button>
        </header>

        {/* ── Scrollable Body ──────────────────────────────────── */}
        <div className="flex flex-col gap-5 overflow-y-auto flex-1 p-5 custom-scrollbar">

          {/* 1. Message */}
          <section>
            <h2 className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
              Message
            </h2>
            <div className="bg-bg-3 border border-border rounded-md px-4 py-3 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
              {log.message}
            </div>
          </section>

          {/* 2. Metadata table */}
          <section>
            <h2 className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
              Metadata
            </h2>
            <div className="rounded-md border border-border overflow-hidden text-xs">
              {metadata.map((row, i) => (
                <div
                  key={row.label}
                  className={clsx(
                    "flex items-start justify-between gap-3 px-4 py-2.5",
                    i % 2 === 0 ? "bg-bg-2" : "bg-bg-3"
                  )}
                >
                  <span className="text-slate-500 whitespace-nowrap shrink-0 w-28">{row.label}</span>
                  <span className="text-right flex-1 break-all">{row.value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Latency bar */}
          <section>
            <h2 className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
              Latency
            </h2>
            <div className="bg-bg-2 border border-border rounded-md px-4 py-4 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">0 ms</span>
                <span className={clsx("font-bold text-sm", latencyTextColor(log.latencyMs))}>
                  {log.latencyMs} ms
                </span>
                <span className="text-slate-500">2000 ms</span>
              </div>
              <div className="h-2.5 w-full bg-bg-4 rounded-full overflow-hidden">
                <div
                  className={clsx("h-full rounded-full transition-all", latencyBarColor(log.latencyMs))}
                  style={{ width: `${latencyPercent(log.latencyMs)}%` }}
                />
              </div>
            </div>
          </section>

          {/* 4. Raw JSON */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                Raw JSON
              </h2>
              <button
                onClick={handleCopy}
                className={clsx(
                  "flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded border transition-all",
                  copied
                    ? "border-green/50 text-green bg-green/10"
                    : "border-border text-slate-400 hover:text-white hover:border-slate-500"
                )}
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="bg-[#0a0c10] border border-border rounded-md p-4 overflow-x-auto custom-scrollbar">
              <pre
                className="text-xs leading-relaxed"
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </div>
          </section>

        </div>
      </aside>
    </>
  );
}
