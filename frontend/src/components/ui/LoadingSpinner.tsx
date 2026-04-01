"use client";

import React from "react";
import clsx from "clsx";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

export default function LoadingSpinner({ size = "md", label, className }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-10 h-10 border-3",
  };

  return (
    <div className={clsx("flex flex-col items-center justify-center gap-3", className)}>
      <div 
        className={clsx(
          "rounded-full border-t-transparent animate-spin",
          sizeMap[size]
        )}
        style={{ borderColor: "var(--green)", borderTopColor: "transparent" }}
      />
      {label && (
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#555f7a] animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
}
