/**
 * src/lib/env.ts
 * 
 * Single source of truth for all NEXT_PUBLIC_ environment variables.
 * Using a centralized file ensures typing and prevents repeated process.env calls.
 */

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? null;
export const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!;

// Environment flags
export const NODE_ENV = process.env.NODE_ENV || "development";
export const IS_PROD = NODE_ENV === "production";
export const IS_DEV = NODE_ENV === "development";
