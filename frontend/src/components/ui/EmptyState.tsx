"use client";

import React, { ReactNode } from "react";
import { Search, CheckCircle2, FileX, Archive } from "lucide-react";
import clsx from "clsx";

interface EmptyStateProps {
  title: string;
  description: string;
  variant?: "search" | "success" | "file" | "archive";
  action?: ReactNode;
}

const VARIANTS = {
  search:  { icon: Search, color: "var(--text3)" },
  success: { icon: CheckCircle2, color: "var(--green)" },
  file:    { icon: FileX, color: "var(--text3)" },
  archive: { icon: Archive, color: "var(--blue)" },
};

export default function EmptyState({ title, description, variant = "search", action }: EmptyStateProps) {
  const { icon: Icon, color } = VARIANTS[variant] || VARIANTS.search;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in duration-500 max-w-sm mx-auto">
      <div className="p-4 rounded-full mb-4" style={{ background: `${color}10`, color: color }}>
        <Icon size={40} strokeWidth={1.5} className="opacity-70" />
      </div>
      
      <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2">
        {title}
      </h3>
      
      <p className="text-[11px] font-mono text-[#555f7a] leading-relaxed mb-6">
        {description}
      </p>

      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}
