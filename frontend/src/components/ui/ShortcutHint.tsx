"use client";

import React, { useState, useEffect } from "react";
import { Keyboard, X } from "lucide-react";

export default function ShortcutHint() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleGlobalEscape = () => setIsOpen(false);
    window.addEventListener("global-escape", handleGlobalEscape);
    return () => window.removeEventListener("global-escape", handleGlobalEscape);
  }, []);

  const shortcuts = [
    { key: "G then D", desc: "Go to Dashboard" },
    { key: "G then L", desc: "Go to Logs Explorer" },
    { key: "G then A", desc: "Go to Alerts" },
    { key: "G then S", desc: "Go to Storage" },
    { key: "/", desc: "Focus Search Input" },
    { key: "ESC", desc: "Close Modals/Drawers" },
    { key: "?", desc: "Show this help" },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900/80 border border-emerald-500/20 text-[10px] font-bold text-emerald-500/60 hover:text-emerald-500 hover:bg-gray-900 transition-all hover:scale-105 shadow-lg backdrop-blur-sm"
      >
        <Keyboard size={12} />
        Press ? for shortcuts
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-gray-950 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X size={20} />
            </button>

            <h3 className="text-emerald-500 font-bold uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
              <Keyboard size={18} />
              Keyboard Shortcuts
            </h3>

            <div className="space-y-3">
              {shortcuts.map((s) => (
                <div key={s.key} className="flex items-center justify-between py-2 border-b border-gray-900 last:border-0">
                  <span className="text-gray-400 text-xs">{s.desc}</span>
                  <div className="flex gap-1">
                    {s.key.split(" then ").map((k, i) => (
                      <React.Fragment key={i}>
                        <kbd className="px-2 py-1 rounded bg-gray-900 border border-gray-800 text-emerald-400 font-mono text-[10px] min-w-[20px] text-center shadow-inner">
                          {k}
                        </kbd>
                        {i === 0 && s.key.includes(" then ") && <span className="text-gray-600 text-[10px] mt-1">then</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-[10px] text-gray-600 text-center uppercase tracking-widest font-bold">
              Tip: Sequences should be typed quickly ({'<' } 800ms)
            </div>
          </div>
        </div>
      )}

      {/* Global listener for ? key */}
      <GlobalKeyListener onTrigger={() => setIsOpen(prev => !prev)} />
    </>
  );
}

function GlobalKeyListener({ onTrigger }: { onTrigger: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) return;

      if (e.key === "?") {
        e.preventDefault();
        onTrigger();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTrigger]);

  return null;
}
