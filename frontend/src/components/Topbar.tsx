"use client";

import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Show } from "./clerk/Show";
import { useEffect, useState } from "react";

interface TopbarProps {
  title: string;
  connected?: boolean;
}

export default function Topbar({ title, connected = true }: TopbarProps) {
  const [time, setTime] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

      {/* Status pill */}
      <div
        className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full"
        style={{
          color: connected ? "var(--green)" : "var(--red)",
          background: connected ? "rgba(0,229,160,0.08)" : "rgba(255,71,87,0.08)",
          border: connected ? "1px solid rgba(0,229,160,0.2)" : "1px solid rgba(255,71,87,0.2)",
        }}
      >
        <span
          className={`${connected ? 'pulse' : ''} w-[7px] h-[7px] rounded-full flex-shrink-0`}
          style={{ background: connected ? "var(--green)" : "var(--red)" }}
        />
        {connected ? "LIVE" : "OFFLINE"}
      </div>

      {/* Clock — Fix Hydration by only showing text after mount */}
      <span className="text-[11px] font-mono w-[65px] text-right" style={{ color: "var(--text3)" }}>
        {mounted ? time : "--:--:--"}
      </span>

      <div className="w-[1px] h-4 bg-[--border] mx-1" />

      {/* Clerk Auth Integration — Unified into Topbar */}
      <div className="flex items-center gap-2">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="px-3 py-1 rounded bg-[#00e5a0] text-[#0d0f14] text-[11px] font-bold hover:opacity-90 transition-all">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="px-3 py-1 rounded border border-[--border] text-[11px] font-bold hover:bg-[--bg3] transition-all">
              Sign Up
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton
            afterSignOutUrl="/sign-in"
            appearance={{
              elements: {
                userButtonAvatarBox: "w-7 h-7",
              },
            }}
          />
        </Show>
      </div>
    </header>
  );
}
