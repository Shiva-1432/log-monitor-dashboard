"use client";

import React, { useState, useMemo } from "react";
import clsx from "clsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ScrollArea } from "./ui/scroll-area";
import { LevelBadge, StatusBadge } from "./ui/badges";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Download } from "lucide-react";
import type { LogEntry } from "@/lib/types";

export type { LogEntry };

interface LogTableProps {
  logs: LogEntry[];
  isLoading?: boolean;
  onSelect?: (log: LogEntry) => void;
  onExport?: () => void;
}

type SortColumn = "timestamp" | "level" | "endpoint" | "message" | "latencyMs" | "statusCode";
type SortDirection = "asc" | "desc";

export function LogTable({ logs, isLoading = false, onSelect, onExport }: LogTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 25;

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [logs, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedLogs.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedLogs = useMemo(() => {
    const start = (safeCurrentPage - 1) * rowsPerPage;
    return sortedLogs.slice(start, start + rowsPerPage);
  }, [sortedLogs, safeCurrentPage, rowsPerPage]);

  const handleExport = () => {
    if (onExport) {
      onExport();
      return;
    }
    
    const fields: (keyof LogEntry)[] = [
      "id", "timestamp", "isoTime", "time", "level", "endpoint", "message", "latencyMs", "statusCode"
    ];
    
    const csvContent = [
      fields.join(","),
      ...sortedLogs.map(row => fields.map(f => {
        let val = row[f] ?? "";
        if (typeof val === "string" && (val.includes(",") || val.includes('"') || val.includes("\n"))) {
           val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "logs_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-20" />;
    return sortDirection === "asc" ? 
      <ArrowUp className="w-3 h-3 ml-1 text-green" /> : 
      <ArrowDown className="w-3 h-3 ml-1 text-green" />;
  };

  return (
    <div className="flex flex-col w-full h-full bg-bg text-slate-300 rounded-md border border-border overflow-hidden font-mono shadow-xl relative z-0">
      {/* Header Bar */}
      <div className="flex justify-between items-center px-4 py-3 bg-bg border-b border-border z-20">
        <h3 className="text-sm font-semibold text-white tracking-wide">Real-Time Logs</h3>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-green border border-green/30 rounded-md hover:bg-green/10 transition-colors"
        >
          <Download className="w-3 h-3" />
          Export CSV
        </button>
      </div>

      <ScrollArea className="flex-1 bg-[#0d0f14]">
        <Table className="min-w-[800px] w-full text-xs">
          <TableHeader className="sticky top-0 bg-[#0d0f14] z-10 shadow-[0_1px_0_var(--tw-shadow-color)] shadow-border/50">
            <TableRow className="hover:bg-transparent border-0">
              <TableHead className="cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("timestamp")}>
                <div className="flex items-center">Time <SortIcon column="timestamp" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("level")}>
                <div className="flex items-center">Level <SortIcon column="level" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("endpoint")}>
                <div className="flex items-center">Endpoint <SortIcon column="endpoint" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:text-white transition-colors w-full" onClick={() => handleSort("message")}>
                <div className="flex items-center">Message <SortIcon column="message" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:text-white transition-colors text-right" onClick={() => handleSort("latencyMs")}>
                <div className="flex items-center justify-end">Latency <SortIcon column="latencyMs" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:text-white transition-colors text-right" onClick={() => handleSort("statusCode")}>
                <div className="flex items-center justify-end">Status <SortIcon column="statusCode" /></div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="border-border">
                   <TableCell colSpan={6}>
                      <div className="w-full h-5 bg-bg-2 rounded animate-pulse" />
                   </TableCell>
                </TableRow>
              ))
            ) : paginatedLogs.length === 0 ? (
              <TableRow className="border-0 hover:bg-transparent">
                <TableCell colSpan={6} className="h-64 text-center text-slate-500 font-sans">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p>no logs match — adjust filters or generate traffic</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedLogs.map((log) => (
                <TableRow 
                  key={log.id} 
                  className="group hover:bg-[#00e5a0]/5 cursor-pointer transition-colors border-border/50"
                  onClick={() => onSelect?.(log)}
                >
                  <TableCell className="whitespace-nowrap text-slate-400 group-hover:text-slate-300">
                    {log.time}
                  </TableCell>
                  <TableCell>
                    <LevelBadge level={log.level} />
                  </TableCell>
                  <TableCell className="text-slate-300 whitespace-nowrap">
                    {log.endpoint}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate text-slate-400 group-hover:text-slate-200" title={log.message}>
                    {log.message}
                  </TableCell>
                  <TableCell className="text-slate-400 text-right whitespace-nowrap">
                    {log.latencyMs}ms
                  </TableCell>
                  <TableCell className="text-right">
                    <StatusBadge code={log.statusCode} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Pagination */}
      {!isLoading && logs.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-[#0d0f14] border-t border-border/50 text-xs text-slate-400 z-20">
          <div>
            Showing {Math.min((safeCurrentPage - 1) * rowsPerPage + 1, logs.length)} to {Math.min(safeCurrentPage * rowsPerPage, logs.length)} of {logs.length} results
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-500">
              Page {safeCurrentPage} of {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-md hover:text-white hover:bg-bg-3 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-md hover:text-white hover:bg-bg-3 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
