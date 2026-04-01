"use client";

import React from "react";
import clsx from "clsx";

interface SkeletonRowProps {
  cols?: number;
  height?: number;
  count?: number;
}

export default function SkeletonRow({ cols = 5, height = 36, count = 1 }: SkeletonRowProps) {
  const renderRow = (idx: number) => (
    <div 
      key={idx} 
      className="flex items-center gap-3 w-full border-b border-[#2a2f42] py-2 px-2 animate-pulse"
      style={{ height }}
    >
      {[...Array(cols)].map((_, i) => (
        <div 
          key={i} 
          className="bg-[#1a1e28] rounded-md h-3" 
          style={{ width: `${Math.floor(Math.random() * (40 - 15 + 1) + 15)}%` }} 
        />
      ))}
    </div>
  );

  return (
    <div className="w-full">
      {[...Array(count)].map((_, i) => renderRow(i))}
    </div>
  );
}
