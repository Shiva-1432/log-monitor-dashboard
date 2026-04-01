"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { fetchLogs, fetchMetrics, LogEntry, Metrics } from "@/lib/api";
import { LevelBadge } from "@/components/ui/badges";
import Topbar from "@/components/Topbar";
import LiveLogFeed from "@/components/stream/LiveLogFeed";
import ErrorBanner from "@/components/ui/ErrorBanner";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { useAsync } from "@/hooks/useAsync";
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
  const [activeTab, setActiveTab] = useState<"live" | "fetched">("live");
  const [isStreamConnected, setIsStreamConnected] = useState(false);

  // Combined data fetching using useAsync
  const fetchData = useCallback(async () => {
    const [logsRes, metricsRes] = await Promise.all([
      fetchLogs({ range: "1h", limit: 8 }),
      fetchMetrics("1h"),
    ]);
    return {
      logs: logsRes.logs,
      metrics: metricsRes.metrics
    };
  }, []);

  const { data, loading, error, reload } = useAsync(fetchData, []);

  // Set up polling for static data when on fetched tab
  useEffect(() => {
    const interval = setInterval(reload, 15000);
    return () => clearInterval(interval);
  }, [reload]);

  const metrics = data?.metrics;
  const logs = data?.logs || [];

  const metricCards = useMemo(() => metrics ? [
    { label: "Total Requests", value: metrics.total.toLocaleString(), color: "#00e5a0", sub: `${metrics.errorRate}% error rate` },
    { label: "Errors",         value: metrics.errors.toString(),      color: "#ff4757", sub: `${metrics.errorRate}% of requests` },
    { label: "Avg Latency",    value: `${metrics.avgLatency}ms`,      color: "#f5a623", sub: "across all endpoints" },
    { label: "Active APIs",    value: `${metrics.endpoints.length}/3`, color: "#4d9fff", sub: "endpoints monitored" },
  ] : [], [metrics]);

  const barData = useMemo(() => metrics?.endpoints.map((ep) => ({
    name:  ep.endpoint,
    value: ep.total,
    color: ep.errorRate > 20 ? "#ff4757" : ep.errorRate > 10 ? "#f5a623" : "#00b87f",
  })) ?? [], [metrics]);

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Overview" connected={activeTab === "live" ? isStreamConnected : false} />
      
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
        
        {/* Error Notification */}
        <ErrorBanner error={error} onDismiss={reload} />

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-3">
          {loading && !data ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl p-4 animate-pulse h-[92px] bg-[#13161e] border border-[#2a2f42]" />
            ))
          ) : (
            metricCards.map((m) => (
              <div key={m.label} className="rounded-xl p-4 relative overflow-hidden bg-[#13161e] border border-[#2a2f42]">
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: m.color }} />
                <div className="text-[10px] font-mono tracking-widest uppercase mb-1.5 text-[#555f7a]">{m.label}</div>
                <div className="text-[26px] font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
                <div className="text-[10px] font-mono mt-1 text-[#555f7a]">{m.sub}</div>
              </div>
            ))
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4 bg-[#13161e] border border-[#2a2f42]">
            <div className="text-[11px] font-mono tracking-wide uppercase mb-3 text-[#8b93a8]">
              Requests by Endpoint
            </div>
            {loading && !data ? (
              <div className="h-[90px] flex items-center justify-center">
                <LoadingSpinner size="sm" label="loading latency..." />
              </div>
            ) : (
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
            )}
          </div>

          <div className="rounded-xl p-4 bg-[#13161e] border border-[#2a2f42]">
            <div className="text-[11px] font-mono tracking-wide uppercase mb-3 text-[#8b93a8]">
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
                    <span className="text-[#8b93a8]">{d.name}</span>
                    <span className="ml-auto font-semibold" style={{ color: d.color }}>{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Logs Interaction Block */}
        <div className="rounded-xl p-4 flex flex-col gap-4 bg-[#13161e] border border-[#2a2f42]">
          <div className="flex items-center justify-between border-b pb-3 border-[#2a2f42]">
            <span className="text-[11px] font-mono tracking-wide uppercase text-[#8b93a8]">
              Recent Log Stream
              {!loading && activeTab === "fetched" && <span className="ml-2 text-[9px] text-[#555f7a]">auto-refreshes every 15s</span>}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex bg-black/20 rounded-md p-1 border border-gray-800">
                <button
                  onClick={() => setActiveTab("live")}
                  className={`text-[10px] font-mono px-3 py-1.5 rounded transition-all ${
                    activeTab === "live" ? "bg-gray-800 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  Live Stream
                </button>
                <button
                  onClick={() => setActiveTab("fetched")}
                  className={`text-[10px] font-mono px-3 py-1.5 rounded transition-all ${
                    activeTab === "fetched" ? "bg-gray-800 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  Last Fetched
                </button>
              </div>
              <a href="/logs" className="text-[10px] font-mono px-3 py-1.5 rounded border ml-2 transition-colors hover:bg-emerald-500/10 text-[#00e5a0] border-[rgba(0,229,160,0.3)]">
                view all →
              </a>
            </div>
          </div>

          <div className="min-h-[400px]">
             {activeTab === "live" && (
                <LiveLogFeed 
                  maxVisible={30} 
                  onConnectionChange={setIsStreamConnected}
                />
              )}
              
              {activeTab === "fetched" && (
                <div className="flex flex-col">
                  {loading && !data ? (
                    <div className="py-20">
                      <LoadingSpinner label="fetching logs from cloudwatch..." />
                    </div>
                  ) : logs.length === 0 ? (
                    <EmptyState 
                      title="No logs found"
                      description="No logs were retrieved for the last window. Suggest running generate-traffic.sh to seed active data."
                      variant="search"
                    />
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="flex items-center gap-2.5 py-2 border-b text-[11px] font-mono hover:bg-gray-800/20 transition-colors px-2 rounded border-[#2a2f42]">
                        <LevelBadge level={log.level} />
                        <span className="min-w-[72px] text-[#555f7a]">{log.time}</span>
                        <span className="min-w-[90px] text-[#8b93a8]">{log.endpoint}</span>
                        <span className="flex-1 truncate text-[#e8ecf0]">{log.message}</span>
                        <span className="min-w-[55px] text-right text-[#555f7a]">{log.latencyMs}ms</span>
                      </div>
                    ))
                  )}
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

