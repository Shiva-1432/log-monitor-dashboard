"use client";

import { DUMMY_APIS } from "@/lib/dummy-data";
import { MethodBadge } from "@/components/ui/badges";
import Topbar from "@/components/Topbar";

function uptimeColor(pct: number) {
  if (pct >= 99) return "var(--green)";
  if (pct >= 95) return "var(--amber)";
  return "var(--red)";
}

function errorColor(pct: number) {
  if (pct < 2) return "var(--green)";
  if (pct < 10) return "var(--amber)";
  return "var(--red)";
}

// Heatmap data: 3 endpoints × 30 time slots
function generateHeatmap() {
  return ["login", "upload", "payment"].map((ep) =>
    Array.from({ length: 30 }, () => {
      const isPayment = ep === "payment";
      const raw = Math.random();
      return isPayment && Math.random() < 0.3 ? raw * 0.5 + 0.5 : raw;
    })
  );
}

const heatmap = generateHeatmap();

function heatColor(v: number) {
  if (v > 0.75) return "var(--red)";
  if (v > 0.5)  return "var(--amber)";
  if (v > 0.25) return "var(--green2)";
  return "var(--bg4)";
}

export default function ApiMonitorPage() {
  return (
    <div className="flex flex-col h-full">
      <Topbar title="API Monitor" />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* API Cards */}
        <div className="grid grid-cols-3 gap-3">
          {DUMMY_APIS.map((api) => (
            <div
              key={api.path}
              className="rounded-xl p-4"
              style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
            >
              <div className="text-[13px] font-semibold font-mono mb-3">
                <MethodBadge method={api.method} />
                {api.path}
              </div>

              <div className="grid grid-cols-4 gap-2 text-[10px] font-mono mb-3">
                {[
                  { label: "Req/min",  value: String(api.reqPerMin),       color: "var(--text)" },
                  { label: "Errors",   value: `${api.errorPct}%`,          color: errorColor(api.errorPct) },
                  { label: "P50",      value: `${api.p50}ms`,              color: "var(--text)" },
                  { label: "P99",      value: api.p99,                     color: "var(--text)" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div style={{ color: "var(--text3)" }}>{stat.label}</div>
                    <div className="font-semibold mt-0.5" style={{ color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Uptime bar */}
              <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "var(--bg4)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${api.uptime}%`, background: uptimeColor(api.uptime) }}
                />
              </div>
              <div className="text-[9px] font-mono mt-1" style={{ color: "var(--text3)" }}>
                {api.uptime}% uptime · last 24h
                {api.uptime < 90 && (
                  <span className="ml-1" style={{ color: "var(--red)" }}>— degraded</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
        >
          <div className="text-[11px] font-mono tracking-wide uppercase mb-3" style={{ color: "var(--text2)" }}>
            Latency Heatmap — all endpoints
          </div>
          <div className="space-y-1.5">
            {["/login", "/upload", "/payment"].map((ep, i) => (
              <div key={ep} className="flex items-center gap-2">
                <span
                  className="text-[9px] font-mono w-[56px] flex-shrink-0 text-right"
                  style={{ color: "var(--text3)" }}
                >
                  {ep}
                </span>
                <div className="flex gap-[3px] flex-1">
                  {heatmap[i].map((v, j) => (
                    <div
                      key={j}
                      className="flex-1 h-3.5 rounded-sm"
                      style={{ background: heatColor(v) }}
                      title={`${Math.round(v * 1000)}ms`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[9px] font-mono" style={{ color: "var(--text3)" }}>30min ago</span>
            <span className="text-[9px] font-mono" style={{ color: "var(--text3)" }}>now</span>
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-3">
            {[
              { color: "var(--bg4)",   label: "fast (<250ms)" },
              { color: "var(--green2)", label: "ok (250–500ms)" },
              { color: "var(--amber)",  label: "slow (500–750ms)" },
              { color: "var(--red)",    label: "critical (>750ms)" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5 text-[9px] font-mono" style={{ color: "var(--text3)" }}>
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
