import React from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import SkeletonRow from "@/components/ui/SkeletonRow";

export default function Loading() {
  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="h-8 w-48 bg-gray-900 rounded-lg animate-pulse mb-8" />
      <div className="rounded-2xl border border-gray-900 bg-gray-950/20 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 border-b border-gray-900/50">
             <SkeletonRow cols={5} />
          </div>
        ))}
      </div>
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
         <LoadingSpinner size="lg" label="Indexing Archive S3 Buckets..." />
      </div>
    </div>
  );
}
