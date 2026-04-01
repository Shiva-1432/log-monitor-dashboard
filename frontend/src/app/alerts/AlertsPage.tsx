"use client";

import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, Trash2, ChevronDown } from "lucide-react";
import clsx from "clsx";

import { fetchAlerts, fetchAlertStats, dismissAlert, clearAlerts, type Alert, type TimeRange } from "@/lib/api";
import AlertStatsUI from "@/components/alerts/AlertStats";
import AlertCard from "@/components/alerts/AlertCard";
import ErrorBanner from "@/components/ui/ErrorBanner";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { useAsync } from "@/hooks/useAsync";

type SeverityFilter = "ALL" | "CRITICAL" | "WARNING" | "INFO";

export default function AlertsPage() {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("ALL");
  const [timeRange, setTimeRange] = useState<TimeRange>("1h");
  const [localAlerts, setLocalAlerts] = useState<Alert[] | null>(null);

  // Load Data via useAsync
  const loadData = useCallback(async () => {
    const [alertsRes, statsRes] = await Promise.all([
      fetchAlerts({ range: timeRange, limit: 100 }),
      fetchAlertStats(),
    ]);
    return {
      alerts: alertsRes.alerts,
      stats: statsRes
    };
  }, [timeRange]);

  const { data, loading, error, reload } = useAsync(loadData, [timeRange]);

  // Handle local state for dismissals
  useEffect(() => {
    if (data?.alerts) {
      setLocalAlerts(data.alerts);
    }
  }, [data]);

  // Periodic Refresh
  useEffect(() => {
    const interval = setInterval(reload, 30000);
    return () => clearInterval(interval);
  }, [reload]);

  // Derived filtered alerts
  const filteredAlerts = (localAlerts || []).filter((a) => {
    if (severityFilter === "ALL") return true;
    return a.severity.toUpperCase() === severityFilter;
  });

  const handleDismissAlert = async (id: string, timestamp: number) => {
    setLocalAlerts((prev) => (prev ? prev.filter((a) => a.id !== id) : []));
    try {
      await dismissAlert(id, timestamp);
    } catch (err) {
      console.error("Failed to dismiss alert:", err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to delete all alerts?")) return;
    try {
      await clearAlerts();
      reload();
    } catch (err) {
      console.error("Clear all failed:", err);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-y-auto bg-[#0d0f14] text-[#8a9bb3] font-mono custom-scrollbar p-6 space-y-6">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#222733] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Alerts</h1>
          <div className="text-sm">
            {loading && !data ? (
               <LoadingSpinner size="sm" label="connecting to backend..." className="flex-row gap-2" />
            ) : (
              <span className="text-[#00e5a0]">
                {(localAlerts || []).length} active alerts · last {timeRange}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Standardized Error Notification */}
      <ErrorBanner error={error} onDismiss={reload} />

      {/* Filter Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#161a23] border border-[#222733] rounded-md p-2 shadow-sm">
        <div className="flex bg-[#0d0f14] rounded overflow-hidden border border-[#222733]">
          {(["ALL", "CRITICAL", "WARNING", "INFO"] as SeverityFilter[]).map((level) => (
            <button
              key={level}
              onClick={() => setSeverityFilter(level)}
              className={clsx(
                "px-4 py-1.5 text-xs font-bold transition-colors border-r border-[#222733] last:border-r-0",
                severityFilter === level
                  ? level === "CRITICAL" ? "bg-[#ff4757]/20 text-[#ff4757]"
                  : level === "WARNING"  ? "bg-[#f5a623]/20 text-[#f5a623]"
                  : level === "INFO"     ? "bg-[#4d9fff]/20 text-[#4d9fff]"
                  : "bg-[#222733] text-white"
                  : "text-[#8a9bb3] hover:bg-[#161a23] hover:text-white"
              )}
            >
              {level}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 ml-auto">
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="appearance-none bg-[#0d0f14] border border-[#222733] rounded pl-3 pr-8 py-1.5 text-xs text-white focus:outline-none focus:border-[#00e5a0]"
            >
              <option value="1h">Last 1 Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8a9bb3]" />
          </div>

          <button
            onClick={reload}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-[#8a9bb3] hover:text-white bg-[#0d0f14] border border-[#222733] rounded px-3 py-1.5 disabled:opacity-50"
          >
            <RefreshCw size={14} className={clsx(loading && data && "animate-spin text-[#00e5a0]")} />
            Refresh
          </button>

          <button
            onClick={handleClearAll}
            disabled={loading || !localAlerts?.length}
            className="flex items-center gap-1.5 text-xs text-[#ff4757] hover:text-white bg-red-900/10 border border-red-900/30 rounded px-3 py-1.5 disabled:opacity-30"
          >
            <Trash2 size={14} />
            Clear All
          </button>
        </div>
      </div>

      <AlertStatsUI stats={data?.stats || null} loading={loading && !data} />

      <div className="space-y-4 pb-8">
        <h2 className="text-white font-medium mb-4 flex items-center justify-between border-b border-[#222733] pb-2">
          <span>Active Alerts</span>
          {filteredAlerts.length > 0 && (
            <span className="text-xs text-[#8a9bb3] font-normal bg-[#222733] px-2 py-0.5 rounded-full">
              Showing {filteredAlerts.length}
            </span>
          )}
        </h2>

        {loading && !data ? (
           <div className="py-20 flex justify-center">
              <LoadingSpinner size="lg" label="scanning dynamodb alerts..." />
           </div>
        ) : filteredAlerts.length === 0 ? (
          <EmptyState 
            title="✓ All Clear"
            description="No active alerts match your current filters. Everything looks within normal thresholds."
            variant="success"
            action={
              <button 
                onClick={() => { setSeverityFilter("ALL"); setTimeRange("24h"); }}
                className="text-[10px] text-[#00e5a0] underline underline-offset-4"
              >
                view last 24h
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <AlertCard 
                key={alert.id} 
                alert={alert} 
                onDismiss={handleDismissAlert} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

