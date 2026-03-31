"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAlerts, Alert } from "@/lib/api";
import { SeverityBadge } from "@/components/ui/badges";
import Topbar from "@/components/Topbar";

const borderColor = { critical: "var(--red)", warning: "var(--amber)", info: "var(--blue)" };

export default function AlertsPage() {
  const [alerts,  setAlerts]  = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [range,   setRange]   = useState<"1h" | "6h" | "24h">("1h");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAlerts(range);
      setAlerts(res.alerts);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const visible = alerts.filter((a) => !dismissed.has(a.id));
  const inputStyle: React.CSSProperties = {
    background:   "var(--bg2)",
    border:       "1px solid var(--border)",
    borderRadius:  7,
    color:        "var(--text2)",
    fontFamily:   "JetBrains Mono, monospace",
    fontSize:     11,
    outline:      "none",
  };

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Alerts" />
      <div className="flex-1 overflow-y-auto p-5">

        <div className="flex items-center gap-3 mb-4">
          <span className="text-[12px] font-mono flex-1" style={{ color: "var(--text2)" }}>
            {loading ? "loading..." : `${visible.length} active alert${visible.length !== 1 ? "s" : ""} · last ${range}`}
          </span>
          <select value={range} onChange={(e) => setRange(e.target.value as "1h" | "6h" | "24h")} className="px-2.5 py-1.5 cursor-pointer" style={inputStyle}>
            <option value="1h">Last 1h</option>
            <option value="6h">Last 6h</option>
            <option value="24h">Last 24h</option>
          </select>
          <button onClick={load} className="text-[11px] font-mono px-3 py-1.5 rounded-md border cursor-pointer" style={{ background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text2)" }}>
            ↻ refresh
          </button>
          <button
            onClick={() => setDismissed(new Set(alerts.map((a) => a.id)))}
            className="text-[11px] font-mono px-3 py-1.5 rounded-md border cursor-pointer"
            style={{ background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.3)", color: "var(--red)" }}
          >
            clear all
          </button>
        </div>

        {error && (
          <div className="rounded-lg px-4 py-3 mb-4 text-[12px] font-mono" style={{ background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.3)", color: "var(--red)" }}>
            ⚠ {error}
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            [...Array(2)].map((_, i) => (
              <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: "var(--bg2)", border: "1px solid var(--border)", height: 100 }} />
            ))
          ) : visible.length === 0 ? (
            <div className="rounded-xl p-8 text-center text-[12px] font-mono" style={{ background: "var(--bg2)", border: "1px solid var(--border)", color: "var(--text3)" }}>
              {alerts.length === 0 ? "no alerts — all thresholds within range ✓" : "all alerts dismissed"}
            </div>
          ) : (
            visible.map((alert) => (
              <div key={alert.id} className="rounded-xl p-4" style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderLeft: `3px solid ${borderColor[alert.severity]}` }}>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <SeverityBadge severity={alert.severity} />
                  <span className="text-[13px] font-semibold flex-1">{alert.title}</span>
                  <span className="text-[10px] font-mono" style={{ color: "var(--text3)" }}>
                    {new Date(alert.time).toLocaleTimeString("en-GB")}
                  </span>
                  <button
                    onClick={() => setDismissed((prev) => new Set([...prev, alert.id]))}
                    className="text-[11px] font-mono px-2 py-0.5 rounded border cursor-pointer ml-2"
                    style={{ color: "var(--text3)", borderColor: "var(--border)", background: "transparent" }}
                  >
                    dismiss
                  </button>
                </div>
                <p className="text-[12px] leading-relaxed mb-2.5" style={{ color: "var(--text2)" }}>{alert.description}</p>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(alert.meta).map(([k, v]) => (
                    <div key={k} className="text-[10px] font-mono" style={{ color: "var(--text3)" }}>
                      {k} <span style={{ color: borderColor[alert.severity] }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
