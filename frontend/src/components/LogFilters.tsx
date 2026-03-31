"use client";

import React, { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import { Search, X, Loader2, RefreshCw, ChevronDown } from "lucide-react";

export type LogLevel = "ALL" | "ERROR" | "WARN" | "INFO";
export type EndpointFilter = "all" | "/login" | "/upload" | "/payment";
export type TimeRange = "1h" | "6h" | "24h" | "7d";

export interface LogFiltersState {
  search: string;
  level: LogLevel;
  endpoint: EndpointFilter;
  range: TimeRange;
  limit: number;
}

interface LogFiltersProps {
  filters: LogFiltersState;
  onChange: (filters: LogFiltersState) => void;
  onRefresh: () => void;
  loading?: boolean;
  total?: number;
}

export function LogFilters({ filters, onChange, onRefresh, loading = false, total = 0 }: LogFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange({ ...filters, search: val });
    }, 500);
  };

  const handleClearSearch = () => {
    setLocalSearch("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onChange({ ...filters, search: "" });
  };

  const updateFilter = <K extends keyof LogFiltersState>(key: K, value: LogFiltersState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-col gap-4 font-mono w-full">
      {/* Search Bar */}
      <div className="relative group w-full">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500 group-focus-within:text-green transition-colors">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder='Search logs... (e.g. "error", "/payment", "500")'
          className={clsx(
            "w-full bg-bg-2 border border-border text-slate-200 text-sm rounded-md",
            "pl-10 pr-10 py-2.5",
            "focus:outline-none focus:border-green focus:shadow-[0_0_8px_rgba(0,229,160,0.3)] transition-all"
          )}
        />
        {localSearch && (
          <button
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Level Chips */}
          <div className="flex items-center p-1 bg-bg-2 border border-border rounded-md">
            {(["ALL", "ERROR", "WARN", "INFO"] as LogLevel[]).map((lvl) => {
              const active = filters.level === lvl;
              let activeClass = "bg-slate-700 text-white"; // default for ALL
              if (active) {
                if (lvl === "ERROR") activeClass = "bg-red/20 text-red";
                else if (lvl === "WARN") activeClass = "bg-amber/20 text-amber";
                else if (lvl === "INFO") activeClass = "bg-blue/20 text-blue";
              }

              return (
                <button
                  key={lvl}
                  onClick={() => updateFilter("level", lvl)}
                  className={clsx(
                    "px-3 py-1 text-xs font-semibold rounded-[4px] transition-colors tracking-wide",
                    active ? activeClass : "text-slate-500 hover:text-slate-300 hover:bg-bg-3"
                  )}
                >
                  {lvl}
                </button>
              );
            })}
          </div>

          {/* Endpoint Dropdown */}
          <div className="relative">
            <select
              value={filters.endpoint}
              onChange={(e) => updateFilter("endpoint", e.target.value as EndpointFilter)}
              className="appearance-none bg-bg-2 border border-border text-slate-300 text-xs font-semibold rounded-md pl-3 pr-8 py-1.5 focus:outline-none focus:border-green focus:ring-1 focus:ring-green cursor-pointer h-[32px] w-[140px]"
            >
              <option value="all">All Endpoints</option>
              <option value="/login">/login</option>
              <option value="/upload">/upload</option>
              <option value="/payment">/payment</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-500">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Time Range Dropdown */}
          <div className="relative">
            <select
              value={filters.range}
              onChange={(e) => updateFilter("range", e.target.value as TimeRange)}
              className="appearance-none bg-bg-2 border border-border text-slate-300 text-xs font-semibold rounded-md pl-3 pr-8 py-1.5 focus:outline-none focus:border-green focus:ring-1 focus:ring-green cursor-pointer h-[32px] w-[100px]"
            >
              <option value="1h">Last 1h</option>
              <option value="6h">Last 6h</option>
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7d</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-500">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
          
          {/* Limit Dropdown */}
          <div className="relative">
            <select
              value={filters.limit}
              onChange={(e) => updateFilter("limit", parseInt(e.target.value, 10))}
              className="appearance-none bg-bg-2 border border-border text-slate-300 text-xs font-semibold rounded-md pl-3 pr-8 py-1.5 focus:outline-none focus:border-green focus:ring-1 focus:ring-green cursor-pointer h-[32px] w-[95px]"
            >
              <option value="50">50 rows</option>
              <option value="100">100 rows</option>
              <option value="250">250 rows</option>
              <option value="500">500 rows</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-500">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Right side: Results & Refresh */}
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 self-end sm:self-auto py-0.5">
          <span>{total} result{total !== 1 ? 's' : ''}</span>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-2 border border-border rounded-md hover:bg-bg-3 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[32px]"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Refresh
          </button>
        </div>
        
      </div>
    </div>
  );
}
