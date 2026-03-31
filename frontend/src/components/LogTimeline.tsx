"use client";

import React, { useMemo, useState } from "react";
import clsx from "clsx";
import { ChevronDown, ChevronRight, Activity } from "lucide-react";
import type { LogEntry } from "@/lib/types";

export type { LogEntry };

export interface LogTimelineProps {
  logs: LogEntry[];
  startTime?: number;
  endTime?: number;
}

const BUCKETS = 30;
export const ENDPOINTS = ["/login", "/upload", "/payment"];

export function LogTimeline({ logs, startTime, endTime }: LogTimelineProps) {
  const [expanded, setExpanded] = useState(true);

  const timelineData = useMemo(() => {
    let minT = startTime;
    let maxT = endTime;

    if (!minT || !maxT) {
      if (logs.length > 0) {
        minT = Math.min(...logs.map((l) => l.timestamp));
        maxT = Math.max(...logs.map((l) => l.timestamp));
      } else {
        const now = Date.now();
        minT = now - 60 * 60 * 1000;
        maxT = now;
      }
    }

    // Safety check if timestamps are identical
    if (maxT <= minT) maxT = minT + 60 * 60 * 1000;

    const duration = maxT - minT;
    const bucketMs = duration / BUCKETS;

    const data: Record<string, { total: number; errors: number }[]> = {};
    for (const ep of ENDPOINTS) {
      data[ep] = Array.from({ length: BUCKETS }, () => ({ total: 0, errors: 0 }));
    }

    let globalMaxVolume = 0;

    for (const log of logs) {
      if (!ENDPOINTS.includes(log.endpoint)) continue;

      let bIdx = Math.floor((log.timestamp - minT) / bucketMs);
      if (bIdx < 0) bIdx = 0;
      if (bIdx >= BUCKETS) bIdx = BUCKETS - 1;

      data[log.endpoint][bIdx].total += 1;
      if (log.level === "ERROR") {
        data[log.endpoint][bIdx].errors += 1;
      }
    }

    for (const ep of ENDPOINTS) {
      for (let i = 0; i < BUCKETS; i++) {
        if (data[ep][i].total > globalMaxVolume) {
          globalMaxVolume = data[ep][i].total;
        }
      }
    }

    return { minT, maxT, data, globalMaxVolume };
  }, [logs, startTime, endTime]);

  return (
    <div className="w-full bg-bg shadow-xl border border-border rounded-md font-mono text-slate-300 overflow-hidden relative z-0">
      {/* Collapsible Header Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-bg-2 border-b border-border hover:bg-bg-3 transition-colors focus:outline-none focus:ring-1 focus:ring-green focus:ring-inset"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-green" />
          <span className="text-sm font-semibold text-white tracking-wide">
            Endpoint Health Timeline
          </span>
        </div>
        <div className="text-slate-500">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Content Area */}
      {expanded && (
        <div className="flex flex-col gap-3 p-4 pt-6">
          {ENDPOINTS.map((ep) => {
            const reqCount = timelineData.data[ep].reduce((acc, b) => acc + b.total, 0);

            return (
              <div key={ep} className="flex items-center gap-4 py-1">
                {/* Left Label */}
                <div className="w-24 text-xs font-semibold text-slate-300 truncate" title={ep}>
                  {ep}
                </div>

                {/* Histograms / Bars */}
                <div className="flex-1 flex items-end gap-[2px] h-10">
                  {timelineData.data[ep].map((bucket, i) => {
                    let colorClass = "bg-[#21263a]"; // no data
                    if (bucket.total > 0) {
                      const errorRate = bucket.errors / bucket.total;
                      if (errorRate > 0.3) colorClass = "bg-[#ff4757]"; // red
                      else if (errorRate > 0.1) colorClass = "bg-[#f5a623]"; // amber
                      else colorClass = "bg-[#00b87f]"; // green
                    }

                    const heightPercent =
                      timelineData.globalMaxVolume > 0
                        ? Math.max(15, (bucket.total / timelineData.globalMaxVolume) * 100)
                        : 15;

                    return (
                      <div
                        key={i}
                        className="group relative flex-1 flex flex-col justify-end h-full hover:z-50"
                      >
                        <div
                          className={clsx(
                            "w-full transition-all hover:brightness-125 rounded-[1px]",
                            colorClass
                          )}
                          style={{
                            height: bucket.total === 0 ? "10%" : `${heightPercent}%`,
                          }}
                        />

                        {/* Tooltip */}
                        <div
                          className={clsx(
                            "absolute bottom-full mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-bg border border-border text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none shadow-lg",
                            i < 4
                              ? "left-0"
                              : i > BUCKETS - 5
                              ? "right-0"
                              : "left-1/2 -translate-x-1/2"
                          )}
                        >
                          {bucket.total} req · {bucket.errors} errors
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Count Label */}
                <div
                  className="w-16 text-right text-xs text-slate-400 font-semibold"
                  title="Total requests in window"
                >
                  {reqCount}
                </div>
              </div>
            );
          })}

          {/* X Axis Range Markers */}
          <div className="flex items-center gap-4 py-1">
            <div className="w-24"></div>
            <div className="flex-1 flex justify-between text-[10px] text-slate-500 uppercase tracking-widest font-semibold px-1">
              <span>Oldest</span>
              <span>Now</span>
            </div>
            <div className="w-16"></div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-2 pt-4 border-t border-border/50 text-[10px] sm:text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#00b87f]"></div>
              <span className="text-slate-400 font-semibold">OK</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#f5a623]"></div>
              <span className="text-slate-400 font-semibold">&gt; 10% err</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#ff4757]"></div>
              <span className="text-slate-400 font-semibold">&gt; 30% err</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#21263a]"></div>
              <span className="text-slate-400 font-semibold">no data</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
