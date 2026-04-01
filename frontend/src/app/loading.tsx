import React from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import SkeletonRow from "@/components/ui/SkeletonRow";

export default function Loading() {
  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 w-48 bg-gray-900 rounded-lg animate-pulse" />
        <div className="h-8 w-32 bg-gray-900 rounded-lg animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-950 border border-gray-900 rounded-2xl animate-pulse flex items-center justify-center">
             <div className="w-12 h-1 bg-gray-900 rounded" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-900 bg-gray-950/20 overflow-hidden">
        <div className="p-4 border-b border-gray-900 bg-gray-900/40">
           <div className="h-4 w-full bg-gray-900 rounded animate-pulse" />
        </div>
        <div className="p-4 space-y-4">
           {[...Array(6)].map((_, i) => (
             <SkeletonRow key={i} cols={6} />
           ))}
        </div>
      </div>

      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
         <LoadingSpinner size="lg" label="Initializing System Components..." />
      </div>
    </div>
  );
}
