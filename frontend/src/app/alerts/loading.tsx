import React from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import SkeletonRow from "@/components/ui/SkeletonRow";

export default function Loading() {
  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="h-8 w-48 bg-gray-900 rounded-lg animate-pulse mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
         {[...Array(3)].map((_, i) => (
           <div key={i} className="h-32 bg-gray-950 border border-gray-900 rounded-2xl animate-pulse" />
         ))}
      </div>
      <div className="rounded-2xl border border-gray-900 bg-gray-950/20 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border-b border-gray-900/50">
             <SkeletonRow cols={5} />
          </div>
        ))}
      </div>
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
         <LoadingSpinner size="lg" label="Scanning For Active Anomalies..." />
      </div>
    </div>
  );
}
