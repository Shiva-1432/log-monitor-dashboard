"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchLogs, LogEntry, LogFilters, LogLevel } from "@/lib/api";
import { LevelBadge, StatusBadge } from "@/components/ui/badges";
import Topbar from "@/components/Topbar";

export default function LogsPage() {
  const [logs,     setLogs]     = useState<LogEntry[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const filters: LogFilters = { level, endpoint, range, search: debouncedSearch, limit: 150 };
      const res = await fetchLogs(filters);
      setLogs(res.logs);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [level, endpoint, range, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const inputStyle: React.CSSProperties = {
    background:  "var(--bg2)",
    border:      "1px solid var(--border)",
    borderRadius: 7,
    color:       "var(--text)",
    fontFamily:  "JetBrains Mono, monospace",
    fontSize:    12,
    outline:     "none",
  };

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Logs Explorer" />
      <div className="flex-1 overflow-y-auto p-5">

        {/* Filters */}
        <div className="flex gap-2.5 mb-4 flex-wrap items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="flex-1 min-w-[200px] px-3 py-2"
            style={inputStyle}
          />
          <select value={level}    onChange={(e) => setLevel(e.target.value as LogLevel | "all")} className="px-2.5 py-2 cursor-pointer" style={{ ...inputStyle, color: "var(--text2)" }}>
            <option value="all">All Levels</option>
            <option value="ERROR">ERROR</option>
            <option value="WARN">WARN</option>
            <option value="INFO">INFO</option>
          </select>
          <select value={endpoint} onChange={(e) => setEndpoint(e.target.value)} className="px-2.5 py-2 cursor-pointer" style={{ ...inputStyle, color: "var(--text2)" }}>
            <option value="all">All Endpoints</option>
            <option value="/login">/login</option>
            <option value="/upload">/upload</option>
            <option value="/payment">/payment</option>
          </select>
          <select value={range}    onChange={(e) => setRange(e.target.value as "1h" | "6h" | "24h")} className="px-2.5 py-2 cursor-pointer" style={{ ...inputStyle, color: "var(--text2)" }}>
            <option value="1h">Last 1h</option>
            <option value="6h">Last 6h</option>
            <option value="24h">Last 24h</option>
          </select>
          <button onClick={load} className="px-3 py-2 rounded-lg text-[11px] font-mono cursor-pointer" style={{ background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text2)" }}>
            ↻ refresh
          </button>
        </div>

        {error && (
          <div className="rounded-lg px-4 py-3 mb-4 text-[12px] font-mono" style={{ background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.3)", color: "var(--red)" }}>
            ⚠ {error}
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
          <table className="w-full text-[11px] font-mono border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Time", "Level", "Endpoint", "Message", "Latency", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-2.5 py-2 text-[10px] tracking-widest uppercase font-medium" style={{ color: "var(--text3)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-2.5 py-3">
                        <div className="h-3 rounded animate-pulse" style={{ background: "var(--bg3)", width: j === 3 ? "100%" : "60%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[12px] font-mono" style={{ color: "var(--text3)" }}>
                    no logs found — adjust filters or generate traffic
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <>
                    <tr
                      key={log.id}
                      style={{ borderBottom: "1px solid rgba(42,47,66,0.5)" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "")}
                    >
                      <td className="px-2.5 py-2.5" style={{ color: "var(--text3)" }}>{log.time}</td>
                      <td className="px-2.5 py-2.5"><LevelBadge level={log.level} /></td>
                      <td className="px-2.5 py-2.5" style={{ color: "var(--text2)" }}>{log.endpoint}</td>
                      <td className="px-2.5 py-2.5 max-w-[200px] truncate" style={{ color: "var(--text)" }}>{log.message}</td>
                      <td className="px-2.5 py-2.5" style={{ color: log.latencyMs > 1000 ? "var(--red)" : log.latencyMs > 500 ? "var(--amber)" : "var(--text2)" }}>
                        {log.latencyMs}ms
                      </td>
                      <td className="px-2.5 py-2.5"><StatusBadge code={log.statusCode} /></td>
                      <td className="px-2.5 py-2.5">
                        <button
                          onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                          className="text-[10px] px-1.5 py-0.5 rounded border cursor-pointer transition-colors"
                          style={{ color: expanded === log.id ? "var(--green)" : "var(--text3)", borderColor: expanded === log.id ? "var(--green)" : "var(--border)", background: "transparent" }}
                        >
                          {expanded === log.id ? "↑" : "{}"}
                        </button>
                      </td>
                    </tr>
                    {expanded === log.id && (
                      <tr key={`${log.id}-expand`}>
                        <td colSpan={7} className="px-2.5 pb-3 pt-0" style={{ background: "var(--bg3)" }}>
                          <pre className="text-[10px] font-mono leading-relaxed rounded-md p-2.5 mt-1.5" style={{ background: "var(--bg)", color: "var(--green)", border: "1px solid var(--border)" }}>
                            {JSON.stringify(log, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && logs.length > 0 && (
          <div className="mt-3 text-[10px] font-mono" style={{ color: "var(--text3)" }}>
            {logs.length} logs · last {range} · click {} to expand raw JSON
          </div>
        )}
      </div>
    </div>
  );
}
