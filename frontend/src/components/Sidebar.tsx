"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import clsx from "clsx";

const NAV = [
  {
    href: "/",
    label: "Dashboard",
    badge: null,
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    href: "/logs",
    label: "Logs Explorer",
    badge: null,
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M2 4h11M2 7h11M2 10h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/alerts",
    label: "Alerts",
    badge: "3",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M7.5 1l1.5 4.5H13l-3.75 2.75L10.5 13 7.5 10 4.5 13l1.25-4.75L2 5.5h4L7.5 1z" stroke="currentColor" strokeWidth="1.1" />
      </svg>
    ),
  },
  {
    href: "/api-monitor",
    label: "API Monitor",
    badge: null,
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M5 7.5h5M7.5 5v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    badge: null,
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.2" />
        <path d="M7.5 1v1.5M7.5 12.5V14M14 7.5h-1.5M2.5 7.5H1M11.7 3.3l-1.06 1.06M4.36 10.64L3.3 11.7M11.7 11.7l-1.06-1.06M4.36 4.36L3.3 3.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <aside
      style={{ background: "var(--bg2)", borderRight: "1px solid var(--border)" }}
      className="w-[220px] min-w-[220px] flex flex-col"
    >
      {/* Logo */}
      <div
        className="px-[18px] py-5 flex items-center gap-2.5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--green)" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="5" rx="1" fill="#0d0f14" />
            <rect x="9" y="2" width="5" height="5" rx="1" fill="#0d0f14" />
            <rect x="2" y="9" width="5" height="5" rx="1" fill="#0d0f14" />
            <circle cx="11.5" cy="11.5" r="2.5" fill="#0d0f14" />
          </svg>
        </div>
        <div>
          <div className="text-[15px] font-bold tracking-wide">LogWatch</div>
          <div className="text-[10px] font-mono tracking-widest" style={{ color: "var(--green)" }}>
            v1.0.0 · LIVE
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2.5 flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all border",
                active ? "border-[--border]" : "border-transparent"
              )}
              style={
                active
                  ? { background: "var(--bg4)", color: "var(--green)" }
                  : { color: "var(--text2)" }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "var(--bg3)";
                  (e.currentTarget as HTMLElement).style.color = "var(--text)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "";
                  (e.currentTarget as HTMLElement).style.color = "var(--text2)";
                }
              }}
            >
              {item.icon}
              {item.label}
              {item.badge && (
                <span className="ml-auto text-[10px] font-mono bg-red text-white rounded px-1.5 py-0.5">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── User row — now powered by Clerk ── */}
      <div className="p-2.5" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg">
          {/* Clerk UserButton renders avatar + dropdown (sign out, manage account) */}
          <UserButton
            afterSignOutUrl="/sign-in"
            appearance={{
              variables: {
                colorPrimary: "#00e5a0",
                colorBackground: "#13161e",
                colorText: "#e8ecf0",
                borderRadius: "8px",
              },
            }}
          />
          <div>
            <div className="text-[12px] font-semibold">
              {user?.firstName ?? "User"}
            </div>
            <div className="text-[10px] font-mono" style={{ color: "var(--text3)" }}>
              {user?.primaryEmailAddress?.emailAddress?.split("@")[0] ?? "admin"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
