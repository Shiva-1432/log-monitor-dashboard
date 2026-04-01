"use client";

import Link from "next/link";
import { Terminal, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-mono">
      <div className="max-w-md w-full border border-gray-900 bg-gray-950 p-8 rounded-2xl shadow-2xl relative overflow-hidden group">
        
        {/* Decorative scanline effect */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent bg-[length:100%_4px] animate-scanline" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8 text-rose-500">
             <Terminal size={24} />
             <span className="text-xs font-bold uppercase tracking-widest">system error</span>
          </div>

          <h1 className="text-8xl font-black text-emerald-500 mb-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            404<span className="animate-pulse inline-block ml-1">_</span>
          </h1>
          
          <p className="text-emerald-500/60 text-sm mb-12 border-l-2 border-emerald-500/20 pl-4 py-1">
            requested_resource: <span className="text-rose-500">NOT_FOUND</span><br />
            this page does not exist in the dashboard index.
          </p>

          <Link 
            href="/"
            className="group/link inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold text-xs uppercase tracking-widest hover:bg-emerald-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <ArrowLeft size={16} className="transition-transform group-hover/link:-translate-x-1" />
            Back to Dashboard
          </Link>
        </div>

        <style jsx global>{`
          @keyframes scanline {
            from { transform: translateY(-100%); }
            to { transform: translateY(100%); }
          }
          .animate-scanline {
            animation: scanline 8s linear infinite;
          }
        `}</style>
      </div>
    </div>
  );
}
