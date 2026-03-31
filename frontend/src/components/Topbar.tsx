"use client";

import { useEffect, useState } from "react";

interface TopbarProps {
  title: string;
}

export default function Topbar({ title }: TopbarProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-GB"));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className="h-[52px] flex items-center px-5 gap-3 flex-shrink-0"
      style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)" }}
    >
      <span className="text-sm font-semibold flex-1">{title}</span>

      {/* Live pill */}
      <div
        className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full"
        style={{
          color: "var(--green)",
          background: "rgba(0,229,160,0.08)",
          border: "1px solid rgba(0,229,160,0.2)",
        }}
      >
        <span
          className="pulse w-[7px] h-[7px] rounded-full flex-shrink-0"
          style={{ background: "var(--green)" }}
        />
        LIVE
      </div>

      {/* Clock */}
      <span className="text-[11px] font-mono" style={{ color: "var(--text3)" }}>
        {time}
      </span>
    </header>
  );
}
