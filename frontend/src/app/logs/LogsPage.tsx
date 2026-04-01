"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Download, RefreshCw, Search, ChevronUp, ChevronDown } from "lucide-react";
import clsx from "clsx";

import { fetchLogs, buildExportUrl, type LogEntry, type LogFilters, type LogLevel } from "@/lib/api";
import { LevelBadge, StatusBadge } from "@/components/ui/badges";
import Topbar from "@/components/Topbar";
import ErrorBanner from "@/components/ui/ErrorBanner";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { useAsync } from "@/hooks/useAsync";

export default function LogsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  // Filter state
  const [level,    setLevel]    = useState<LogLevel | "all">("all");
  const [endpoint, setEndpoint] = useState("all");
  const [range,    setRange]    = useState<"1h" | "6h" | "24h">("1h");
  const [search,   setSearch]   = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  // Load Data via useAsync
  const loadData = useCallback(async () => {
    const filters: LogFilters = { 
      level: level === "all" ? undefined : level, 
      endpoint: endpoint === "all" ? undefined : endpoint, 
      range, 
      search: debouncedSearch, 
      limit: 150 
    };
    const res = await fetchLogs(filters);
    return res.logs;
  }, [level, endpoint, range, debouncedSearch]);

  const { data: logs, loading, error, reload } = useAsync(loadData, [level, endpoint, range, debouncedSearch]);

  const handleExport = () => {
    const filters: LogFilters = { level, endpoint, range, search: debouncedSearch, limit: 1000 };
    const url = buildExportUrl(filters);
    window.open(url, "_blank");
  };

  const inputStyle: React.CSSProperties = {
    background:  "var(--bg2)",
    border:      "1px solid var(--border)",
    borderRadius: 8,
    color:       "var(--text)",
    fontFamily:  "JetBrains Mono, monospace",
    fontSize:    12,
    outline:     "none",
  };

  return (
    <div className="flex flex-col h-full bg-black">
      <Topbar title="Logs Explorer" />
      
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        
        {/* Unified Error Banner */}
        <ErrorBanner error={error} onDismiss={reload} />

        {/* Filters & Actions Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6 bg-gray-950/40 p-3 rounded-xl border border-gray-900">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search in log messages..."
              className="w-full pl-9 pr-3 py-2 transition-all focus:border-emerald-500/50"
              style={inputStyle}
            />
          </div>

          <div className="flex items-center gap-2">
            <select 
              value={level} 
              onChange={(e) => setLevel(e.target.value as LogLevel | "all")} 
              className="px-3 py-2 cursor-pointer h-[34px]" 
              style={{ ...inputStyle, color: "var(--text2)" }}
            >
              <option value="all">Level: ALL</option>
              <option value="ERROR">ERROR</option>
              <option value="WARN">WARN</option>
              <option value="INFO">INFO</option>
            </select>

            <select 
              value={endpoint} 
              onChange={(e) => setEndpoint(e.target.value)} 
              className="px-3 py-2 cursor-pointer h-[34px]" 
              style={{ ...inputStyle, color: "var(--text2)" }}
            >
              <option value="all">Endpoint: ALL</option>
              <option value="/login">/login</option>
              <option value="/upload">/upload</option>
              <option value="/payment">/payment</option>
            </select>

            <select 
              value={range} 
              onChange={(e) => setRange(e.target.value as any)} 
              className="px-3 py-2 cursor-pointer h-[34px]" 
              style={{ ...inputStyle, color: "var(--text2)" }}
            >
              <option value="1h">Last 1h</option>
              <option value="6h">Last 6h</option>
              <option value="24h">Last 24h</option>
            </select>
          </div>

          <div className="h-6 w-px bg-gray-800 mx-1 hidden md:block" />

          <div className="flex items-center gap-2 ml-auto">
            <button 
              onClick={reload} 
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-gray-400 bg-gray-900 border border-gray-800 hover:bg-gray-800 transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={clsx(loading && "animate-spin")} />
              Refresh
            </button>
            <button 
              onClick={handleExport}
              disabled={loading || !logs?.length}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-30"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="rounded-xl overflow-hidden border border-gray-900 bg-gray-950/20">
          <table className="w-full text-[11px] font-mono border-collapse">
            <thead>
              <tr className="bg-gray-900/40 border-b border-gray-900">
                {["Timestamp", "Level", "Endpoint", "Message", "Latency", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-3 py-3 text-[10px] tracking-widest uppercase font-bold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-950">
              {loading && !logs ? (
                /* Static loading placeholder or Spinner center */
                <tr>
                  <td colSpan={7} className="py-32">
                    <div className="flex justify-center">
                       <LoadingSpinner size="lg" label="querying cloudwatch insights..." />
                    </div>
                  </td>
                </tr>
              ) : !logs || logs.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState 
                      title="No logs found"
                      description="Adjust your search filters or generate traffic to see results."
                      variant="search"
                      action={
                        <button 
                          onClick={() => { setSearch(""); setLevel("all"); }}
                          className="text-[10px] text-emerald-500 underline underline-offset-4"
                        >
                          clear filters
                        </button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr
                      className={clsx(
                        "group transition-colors hover:bg-emerald-500/[0.02]",
                        expanded === log.id && "bg-emerald-500/[0.04]"
                      )}
                    >
                      <td className="px-3 py-3 text-gray-500 font-medium">{log.time}</td>
                      <td className="px-3 py-3"><LevelBadge level={log.level} /></td>
                      <td className="px-3 py-3 text-gray-400">{log.endpoint}</td>
                      <td className="px-3 py-3 max-w-[300px] truncate group-hover:text-white transition-colors text-gray-200">
                        {log.message}
                      </td>
                      <td className={clsx(
                        "px-3 py-3 font-bold",
                        log.latencyMs > 1000 ? "text-rose-500" : log.latencyMs > 500 ? "text-amber-500" : "text-gray-500"
                      )}>
                        {log.latencyMs}ms
                      </td>
                      <td className="px-3 py-3"><StatusBadge code={log.statusCode} /></td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                          className={clsx(
                            "p-1.5 rounded-lg border transition-all hover:border-emerald-500/50",
                            expanded === log.id 
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" 
                              : "bg-transparent border-gray-800 text-gray-600"
                          )}
                        >
                          {expanded === log.id ? <ChevronUp size={14} /> : <div className="text-[10px] w-3.5">{}</div>}
                        </button>
                      </td>
                    </tr>
                    {expanded === log.id && (
                      <tr className="bg-gray-900/30">
                        <td colSpan={7} className="px-3 py-4">
                          <div className="relative group">
                             <div className="absolute top-2 right-2 text-[10px] text-gray-600 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Raw JSON Object</div>
                             <pre className="text-[10px] font-mono leading-relaxed rounded-xl p-4 bg-gray-950 border border-emerald-500/20 text-emerald-400 overflow-x-auto shadow-inner">
                              {JSON.stringify(log, null, 2)}
                             </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && logs && logs.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-gray-600 uppercase tracking-widest">
            <div>Result Set: {logs.length} entries · Page 1 of 1</div>
            <div>Latest sync: {new Date().toLocaleTimeString()}</div>
          </div>
        )}
      </div>
    </div>
  );
}

