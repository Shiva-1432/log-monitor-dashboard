"use client";

import Sidebar from "@/components/Sidebar";
import ShortcutHint from "@/components/ui/ShortcutHint";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useKeyboardShortcuts();

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {children}
      </main>
      <ShortcutHint />
    </div>
  );
}
