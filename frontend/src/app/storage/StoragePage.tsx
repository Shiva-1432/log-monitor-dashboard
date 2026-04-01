"use client";

import React, { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import StorageStats from "@/components/storage/StorageStats";
import LogFileTable from "@/components/storage/LogFileTable";
import { 
  fetchLogFiles, 
  getDownloadUrl, 
  fetchFileContent, 
  deleteLogFile, 
  fetchArchiverStatus, 
  triggerArchiveNow,
  LogFile,
  ArchiverStatus,
  StorageFile
} from "@/lib/api";
import { 
  RefreshCcw, 
  Zap, 
  X, 
  Download, 
  Calendar,
} from "lucide-react";
import { LevelBadge } from "@/components/ui/badges";
import ErrorBanner from "@/components/ui/ErrorBanner";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { useAsync } from "@/hooks/useAsync";

export default function StoragePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedEndpoint, setSelectedEndpoint] = useState("all");
  
  const [previewFile, setPreviewFile] = useState<StorageFile | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [archiving, setArchiving] = useState(false);

  // Load Data via useAsync
  const loadData = useCallback(async () => {
    const [filesRes, statusRes] = await Promise.all([
      fetchLogFiles({ endpoint: selectedEndpoint, date: selectedDate }),
      fetchArchiverStatus()
    ]);
    return {
      files: filesRes.files,
      status: statusRes
    };
  }, [selectedDate, selectedEndpoint]);

  const { data, loading, error, reload } = useAsync(loadData, [selectedDate, selectedEndpoint]);

  // Periodic Refresh
  useEffect(() => {
    const interval = setInterval(reload, 60000);
    return () => clearInterval(interval);
  }, [reload]);

  const handleArchiveNow = async () => {
    setArchiving(true);
    try {
      await triggerArchiveNow();
      setTimeout(() => {
        setArchiving(false);
        reload();
      }, 2000);
    } catch (err) {
      setArchiving(false);
    }
  };

  const handleDownload = async (key: string) => {
    try {
      const { url } = await getDownloadUrl(key);
      window.open(url, "_blank");
    } catch (err: any) {
      alert("Download failed: " + err.message);
    }
  };

  const handleDelete = async (key: string) => {
    try {
      await deleteLogFile(key);
      reload();
    } catch (err) {
      alert("Deletion failed");
    }
  };

  const handlePreview = async (key: string) => {
    setPreviewLoading(true);
    try {
      const content = await fetchFileContent(key);
      setPreviewFile(content);
    } catch (err: any) {
      alert("Failed to load file content: " + err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const files = data?.files || [];
  const status = data?.status || null;

  return (
    <div className="flex flex-col h-full bg-black font-mono selection:bg-emerald-500/30">
      <Topbar title="Log History" />
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        
        {/* Unified Error Banner */}
        <ErrorBanner error={error} onDismiss={reload} />

        {/* 2. Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-950/50 p-4 rounded-xl border border-gray-900">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-500 transition-colors" size={16} />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-gray-900 border border-gray-800 text-gray-300 text-xs rounded-lg pl-10 pr-3 py-2 outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>

            <div className="flex bg-gray-900/50 p-1 rounded-lg border border-gray-800 select-none">
              {["all", "/login", "/upload", "/payment"].map((ep) => (
                <button
                  key={ep}
                  onClick={() => setSelectedEndpoint(ep)}
                  className={`px-3 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-wider transition-all ${
                    selectedEndpoint === ep 
                      ? "bg-gray-800 text-emerald-400 shadow-sm" 
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {ep === "all" ? "ALL" : ep}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={reload}
              disabled={loading}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
            >
              <RefreshCcw size={14} className={loading && data ? "animate-spin" : ""} />
              Refresh
            </button>
            <button 
              onClick={handleArchiveNow}
              disabled={archiving}
              className={`flex items-center gap-2 border px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                archiving 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" 
                  : "bg-transparent border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
              }`}
            >
              {archiving ? (
                <>
                  <RefreshCcw size={14} className="animate-spin" />
                  Archiving...
                </>
              ) : (
                <>
                  <Zap size={14} />
                  Archive Now
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Storage Runtime Health</div>
          <StorageStats status={status} loading={loading && !data} />
        </div>

        <div className="pt-4 border-t border-gray-900 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-100 tracking-wide uppercase">Archived S3 Objects</h2>
              <span className="bg-gray-800 text-gray-400 text-[10px] px-2 py-0.5 rounded-full border border-gray-700">
                {files.length}
              </span>
            </div>
          </div>

          {loading && !data ? (
            <div className="py-20 flex justify-center border border-dashed border-gray-800 rounded-xl">
               <LoadingSpinner label="listing s3 objects..." />
            </div>
          ) : files.length === 0 ? (
            <EmptyState 
              title="No files found"
              description="No logs have been archived for this endpoint on the selected date. Ensure the archiver is running."
              variant="archive"
              action={
                <button 
                  onClick={handleArchiveNow}
                  className="px-4 py-2 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase rounded-lg border border-emerald-500/30"
                >
                  Trigger Archiver
                </button>
              }
            />
          ) : (
            <LogFileTable 
              files={files} 
              loading={loading}
              onDownload={handleDownload}
              onPreview={handlePreview}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      {/* Preview Drawer remains similar but with added loading state */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex justify-end">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPreviewFile(null)} />
           <div className="relative w-full max-w-[550px] h-full bg-gray-950 border-l border-gray-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-900 bg-gray-900/50">
              <div className="space-y-1">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Inspecting Archive</div>
                <div className="text-sm font-bold text-emerald-400 truncate max-w-[380px] font-mono">{previewFile.key}</div>
              </div>
              <button onClick={() => setPreviewFile(null)} className="p-2 rounded-full hover:bg-gray-800 text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-3 divide-x divide-gray-900 border-b border-gray-900 bg-gray-900/20">
              <div className="p-4 text-center">
                <div className="text-[9px] text-gray-600 uppercase mb-1">Archived At</div>
                <div className="text-[11px] font-bold">{new Date(previewFile.savedAt).toLocaleTimeString("en-GB")}</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-[9px] text-gray-600 uppercase mb-1">Endpoint</div>
                <div className="text-[11px] font-bold text-emerald-500">{previewFile.endpoint}</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-[9px] text-gray-600 uppercase mb-1">Log Count</div>
                <div className="text-[11px] font-bold">{previewFile.count}</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {previewFile.logs.map((log, i) => (
                 <div key={i} className="flex items-center gap-2.5 py-1.5 px-3 border-b border-gray-900 text-[10px] font-mono hover:bg-gray-800/40 transition-colors">
                    <LevelBadge level={log.level} />
                    <span className="text-gray-500 min-w-[65px]">{log.time}</span>
                    <span className="text-gray-200 flex-1 truncate">{log.message}</span>
                    <span className="text-gray-600">{log.latencyMs}ms</span>
                 </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-900 bg-gray-900/50">
               <button 
                onClick={() => handleDownload(previewFile.key)}
                className="w-full flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-gray-950 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/10"
               >
                 <Download size={18} />
                 Download this file
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {previewLoading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
             <LoadingSpinner label="Decrypting from S3..." />
          </div>
        </div>
      )}
    </div>
  );
}

