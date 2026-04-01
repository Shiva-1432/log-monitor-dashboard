"use client";

import { useAuth } from "@clerk/nextjs";
import React from "react";

interface ShowProps {
  when: "signed-in" | "signed-out";
  children: React.ReactNode;
}

/**
 * LogWatch Custom Clerk Wrapper — <Show>
 * Implements the component pattern requested in the project rules.
 * Maps 'signed-in' and 'signed-out' logic to standard Clerk hooks.
 */
export function Show({ when, children }: ShowProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Return null on server or before client hydration
  if (!mounted || !isLoaded) return null;

  if (when === "signed-in" && isSignedIn) {
    return <>{children}</>;
  }

  if (when === "signed-out" && !isSignedIn) {
    return <>{children}</>;
  }

  return null;
}
