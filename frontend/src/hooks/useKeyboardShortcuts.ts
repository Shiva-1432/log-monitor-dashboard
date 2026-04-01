"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

export function useKeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const buffer = useRef<string>("");
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if focus is in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        // Special case: / key to focus search on logs page
        if (e.key === "/" && pathname === "/logs") {
          // Check if it's JUST the slash and not inside an input (which would be the case since activeElement is not an input)
          return;
        }
        return;
      }

      // Handle G sequence
      if (e.key.toLowerCase() === "g") {
        buffer.current = "g";
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          buffer.current = "";
        }, 800); // 800ms window
        return;
      }

      const key = e.key.toLowerCase();

      // Execute sequences
      if (buffer.current === "g") {
        if (key === "d") router.push("/");
        if (key === "l") router.push("/logs");
        if (key === "a") router.push("/alerts");
        if (key === "s") router.push("/storage");
        
        buffer.current = "";
        if (timer.current) clearTimeout(timer.current);
        return;
      }

      // Global shortcuts
      if (key === "/") {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }

      if (key === "escape") {
        // This is a generic escape handler. Components should also handle escape locally.
        // But we can emit a custom event for global closures if needed.
        window.dispatchEvent(new CustomEvent("global-escape"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, pathname]);
}
