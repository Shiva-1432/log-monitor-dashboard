"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { fetchLogs, fetchMetrics, LogEntry, Metrics } from "@/lib/api";
import { LevelBadge } from "@/components/ui/badges";
import Topbar from "@/components/Topbar";
import {
  BarChart, Bar, ResponsiveContainer,
  Tooltip, Cell, PieChart, Pie,
} from "recharts";

const PIE_DATA = [
  { name: "5xx Server", value: 48, color: "#ff4757" },
  { name: "4xx Client", value: 33, color: "#f5a623" },
  { name: "Timeout",    value: 19, color: "#4d9fff" },
];

export default function DashboardPage() {
  const [logs,    setLogs]    = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(async () => {
    try {
      const [logsRes, metricsRes] = await Promise.all([
        fetchLogs({ range: "1h", limit: 8 }),
        fetchMetrics("1h"),
      ]);
      setLogs(logsRes.logs);
      setMetrics(metricsRes.metrics);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 15000); // poll every 15s
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [load]);

  const metricCards = metrics ? [
    { label: "Total Requests", value: metrics.total.toLocaleString(), color: "#00e5a0", sub: `${metrics.errorRate}% error rate` },
    { label: "Errors",         value: metrics.errors.toString(),      color: "#ff4757", sub: `${metrics.errorRate}% of requests` },
    { label: "Avg Latency",    value: `${metrics.avgLatency}ms`,      color: "#f5a623", sub: "across all endpoints" },
    { label: "Active APIs",    value: `${metrics.endpoints.length}/3`, color: "#4d9fff", sub: "endpoints monitored" },
  ] : [];

  // Bar chart from per-endpoint totals
  const barData = metrics?.endpoints.map((ep) => ({
    name:  ep.endpoint,
    value: ep.total,
    color: ep.errorRate > 20 ? "#ff4757" : ep.errorRate > 10 ? "#f5a623" : "#00b87f",
  })) ?? [];

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Overview" />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* Error banner */}
        {error && (
          <div className="rounded-lg px-4 py-3 text-[12px] font-mono" style={{ background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.3)", color: "var(--red)" }}>
            ⚠ Backend unreachable: {error} — check your Express server is running on port 4000
          </div>
        )}

        {/* Metrics */}
        {loading ? (
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: "var(--bg2)", border: "1px solid var(--border)", height: 92 }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {metricCards.map((m) => (
              <div key={m.label} className="rounded-xl p-4 relative overflow-hidden" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: m.color }} />
                <div className="text-[10px] font-mono tracking-widest uppercase mb-1.5" style={{ color: "var(--text3)" }}>{m.label}</div>
                <div className="text-[26px] font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
                <div className="text-[10px] font-mono mt-1" style={{ color: "var(--text3)" }}>{m.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
            <div className="text-[11px] font-mono tracking-wide uppercase mb-3" style={{ color: "var(--text2)" }}>
              Requests by Endpoint
            </div>
            <ResponsiveContainer width="100%" height={90}>
              <BarChart data={barData} barCategoryGap="30%">
                <Tooltip
                  contentStyle={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11, fontFamily: "JetBrains Mono" }}
                  itemStyle={{ color: "var(--text)" }}
                  formatter={(v: number) => [`${v} req`, ""]}
                />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {barData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl p-4" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
            <div className="text-[11px] font-mono tracking-wide uppercase mb-3" style={{ color: "var(--text2)" }}>
              Error Distribution
            </div>
            <div className="flex items-center gap-4">
              <PieChart width={80} height={80}>
                <Pie data={PIE_DATA} cx={35} cy={35} innerRadius={22} outerRadius={36} dataKey="value" strokeWidth={0}>
                  {PIE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
              <div className="flex flex-col gap-2 flex-1">
                {PIE_DATA.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-[11px] font-mono">
                    <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                    <span style={{ color: "var(--text2)" }}>{d.name}</span>
                    <span className="ml-auto font-semibold" style={{ color: d.color }}>{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live Logs */}
        <div className="rounded-xl p-4" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono tracking-wide uppercase" style={{ color: "var(--text2)" }}>
              Recent Log Stream
              {!loading && <span className="ml-2 text-[9px]" style={{ color: "var(--text3)" }}>auto-refreshes every 15s</span>}
            </span>
            <a href="/logs" className="text-[10px] font-mono px-2 py-1 rounded border" style={{ color: "var(--green)", borderColor: "rgba(0,229,160,0.3)" }}>
              view all →
            </a>
          </div>
          {logs.length === 0 && !loading ? (
            <div className="text-center py-6 text-[11px] font-mono" style={{ color: "var(--text3)" }}>
              no logs yet — run generate-traffic.sh to seed data
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-center gap-2.5 py-1.5 border-b text-[11px] font-mono" style={{ borderColor: "var(--border)" }}>
                <LevelBadge level={log.level} />
                <span className="min-w-[72px]" style={{ color: "var(--text3)" }}>{log.time}</span>
                <span className="min-w-[90px]" style={{ color: "var(--text2)" }}>{log.endpoint}</span>
                <span className="flex-1 truncate" style={{ color: "var(--text)" }}>{log.message}</span>
                <span className="min-w-[55px] text-right" style={{ color: "var(--text3)" }}>{log.latencyMs}ms</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
