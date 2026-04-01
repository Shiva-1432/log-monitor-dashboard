"use client";

import React from "react";
import clsx from "clsx";

export interface AlertStats {
  total: number;
  critical: number;
  warning: number;
  info: number;
  byType: {
    ERROR_SPIKE: number;
    HIGH_LATENCY: number;
  };
  byEndpoint: Record<string, number>;
  fetchedAt: string;
}

interface AlertStatsProps {
  stats: AlertStats | null;
  loading: boolean;
}

export default function AlertStats({ stats, loading }: AlertStatsProps) {
  if (loading || !stats) {
    return (
      <div className="w-full space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-[#161a23] rounded-md border border-[#222733] animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-48 bg-[#161a23] rounded-md border border-[#222733] animate-pulse" />
          <div className="h-48 bg-[#161a23] rounded-md border border-[#222733] animate-pulse" />
        </div>
      </div>
    );
  }

  // Find max endpoint count for highlighting the highest value
  const maxEndpointCount = Math.max(0, ...Object.values(stats.byEndpoint));

  return (
    <div className="w-full space-y-4 font-mono">
      {/* Row 1: Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Alerts */}
        <div className="bg-[#161a23] rounded-md border-t-4 border-t-[#3b4354] border-[#222733] p-4 flex flex-col justify-center">
          <div className="text-3xl font-bold text-white mb-1">
            {stats.total.toLocaleString()}
          </div>
          <div className="text-xs text-[#8a9bb3] uppercase tracking-wider">
            Total Alerts
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-[#161a23] rounded-md border-t-4 border-t-[#ff4757] border-[#222733] p-4 flex flex-col justify-center">
          <div className="text-3xl font-bold text-white mb-1">
            {stats.critical.toLocaleString()}
          </div>
          <div className="text-xs text-[#ff4757] uppercase tracking-wider">
            Critical
          </div>
        </div>

        {/* Warning Alerts */}
        <div className="bg-[#161a23] rounded-md border-t-4 border-t-[#f5a623] border-[#222733] p-4 flex flex-col justify-center">
          <div className="text-3xl font-bold text-white mb-1">
            {stats.warning.toLocaleString()}
          </div>
          <div className="text-xs text-[#f5a623] uppercase tracking-wider">
            Warning
          </div>
        </div>

        {/* Info Alerts */}
        <div className="bg-[#161a23] rounded-md border-t-4 border-t-[#4d9fff] border-[#222733] p-4 flex flex-col justify-center">
          <div className="text-3xl font-bold text-white mb-1">
            {stats.info.toLocaleString()}
          </div>
          <div className="text-xs text-[#4d9fff] uppercase tracking-wider">
            Info
          </div>
        </div>
      </div>

      {/* Row 2: Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By Type Card */}
        <div className="bg-[#161a23] rounded-md border border-[#222733] p-4">
          <div className="text-sm text-[#8a9bb3] uppercase tracking-wider mb-4 border-b border-[#222733] pb-2">
            By Type
          </div>
          <div className="space-y-4">
            {/* ERROR_SPIKE */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-white">ERROR_SPIKE</span>
                <span className="text-[#8a9bb3]">{stats.byType.ERROR_SPIKE.toLocaleString()}</span>
              </div>
              <div className="w-full h-1.5 bg-[#222733] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#ff4757]"
                  style={{ width: `${stats.total > 0 ? (stats.byType.ERROR_SPIKE / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            
            {/* HIGH_LATENCY */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-white">HIGH_LATENCY</span>
                <span className="text-[#8a9bb3]">{stats.byType.HIGH_LATENCY.toLocaleString()}</span>
              </div>
              <div className="w-full h-1.5 bg-[#222733] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#f5a623]"
                  style={{ width: `${stats.total > 0 ? (stats.byType.HIGH_LATENCY / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* By Endpoint Card */}
        <div className="bg-[#161a23] rounded-md border border-[#222733] p-4 custom-scrollbar overflow-y-auto max-h-64">
          <div className="text-sm text-[#8a9bb3] uppercase tracking-wider mb-4 border-b border-[#222733] pb-2 sticky top-0 bg-[#161a23] z-10">
            By Endpoint
          </div>
          {Object.keys(stats.byEndpoint).length === 0 ? (
            <div className="text-xs text-[#8a9bb3] italic">No endpoint data available.</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.byEndpoint)
                .sort((a, b) => b[1] - a[1]) // Sort descending by count
                .map(([endpoint, count]) => {
                  const isHighest = count === maxEndpointCount && count > 0;
                  const barColor = isHighest ? "bg-[#ff4757]" : "bg-[#f5a623]";
                  const widthPercent = maxEndpointCount > 0 ? (count / maxEndpointCount) * 100 : 0;
                  
                  return (
                    <div key={endpoint}>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-white truncate pr-2" title={endpoint}>{endpoint}</span>
                        <span className="text-[#8a9bb3] whitespace-nowrap">{count.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#222733] rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor}`}
                          style={{ width: `${widthPercent}%` }}
                        />
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
