"use client";

import React, { useMemo } from "react";
import { LogFile } from "../../lib/api";
import { Eye, Download, Trash2, FileText, Clock } from "lucide-react";

interface LogFileTableProps {
  files: LogFile[];
  loading: boolean;
  onDownload: (key: string) => void;
  onPreview: (key: string) => void;
  onDelete: (key: string) => void;
}

/**
 * Simple relative time helper for Age column
 */
function getAge(lastModified: string): string {
  const now = Date.now();
  const diff = now - new Date(lastModified).getTime();
  
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

/**
 * Extracts YYYY/MM/DD from S3 key: logs/2026/03/31/...
 */
function extractDate(key: string): string {
  const parts = key.split("/");
  if (parts.length >= 4) {
    return `${parts[1]}/${parts[2]}/${parts[3]}`;
  }
  return "unknown";
}

export default function LogFileTable({
  files,
  loading,
  onDownload,
  onPreview,
  onDelete,
}: LogFileTableProps) {
  
  // Ensure files are sorted by lastModified descending if not already
  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
  }, [files]);

  const handleDelete = (key: string) => {
    if (window.confirm("Delete this log file? This cannot be undone.")) {
      onDelete(key);
    }
  };

  const endpointStyles: Record<string, string> = {
    "/login":   "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    "/upload":  "bg-blue-500/10 text-blue-400 border-blue-500/30",
    "/payment": "bg-amber-500/10 text-amber-400 border-amber-500/30",
    "all":      "bg-purple-500/10 text-purple-400 border-purple-500/30",
  };

  if (loading) {
    return (
      <div className="w-full border border-gray-800 rounded-lg overflow-hidden bg-gray-950 font-mono">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-900 text-gray-500 border-b border-gray-800">
            <tr>
              <th className="px-4 py-3 font-medium uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 font-medium uppercase tracking-wider">Endpoint</th>
              <th className="px-4 py-3 font-medium uppercase tracking-wider">Size</th>
              <th className="px-4 py-3 font-medium uppercase tracking-wider">Age</th>
              <th className="px-4 py-3 font-medium uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-4 py-4"><div className="h-3 w-20 bg-gray-800 rounded"></div></td>
                <td className="px-4 py-4"><div className="h-5 w-24 bg-gray-800 rounded"></div></td>
                <td className="px-4 py-4"><div className="h-3 w-12 bg-gray-800 rounded"></div></td>
                <td className="px-4 py-4"><div className="h-3 w-16 bg-gray-800 rounded"></div></td>
                <td className="px-4 py-4 text-right"><div className="h-6 w-20 bg-gray-800 rounded ml-auto"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="w-full border border-gray-800 rounded-lg overflow-hidden bg-gray-950 font-mono text-gray-300 shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-gray-900 text-gray-400 border-b border-gray-800">
            <tr>
              <th className="px-4 py-3 font-semibold uppercase tracking-widest whitespace-nowrap">Date</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-widest whitespace-nowrap">Endpoint</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-widest whitespace-nowrap">Size</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-widest whitespace-nowrap">Age</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {sortedFiles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-500 bg-gray-950/50">
                  <div className="flex flex-col items-center gap-2">
                    <FileText size={24} className="text-gray-700" />
                    <span>No log files found in storage</span>
                    <span className="text-[10px] opacity-60">Archiver runs every few minutes automatically</span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedFiles.map((file) => (
                <tr key={file.key} className="hover:bg-gray-900/50 transition-colors group">
                  {/* Date Column */}
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500 font-medium">
                    {extractDate(file.key)}
                  </td>

                  {/* Endpoint Column */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${endpointStyles[file.endpoint] || endpointStyles['all']}`}>
                      {file.endpoint}
                    </span>
                  </td>

                  {/* Size Column */}
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-400">
                    {file.sizeFormatted}
                  </td>

                  {/* Age Column */}
                  <td className="px-4 py-3 whitespace-nowrap group-hover:text-gray-100 transition-colors">
                    <div className="flex items-center gap-1.5 text-gray-500 group-hover:text-amber-400/80 transition-colors">
                      <Clock size={12} />
                      {getAge(file.lastModified)}
                    </div>
                  </td>

                  {/* Actions Column */}
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onPreview(file.key)}
                        title="Preview"
                        className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-blue-400 transition-all active:scale-90"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onDownload(file.key)}
                        title="Download"
                        className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-emerald-400 transition-all active:scale-90"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(file.key)}
                        title="Delete"
                        className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-rose-500 transition-all active:scale-90"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
