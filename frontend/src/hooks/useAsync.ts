/**
 * src/hooks/useAsync.ts
 *
 * A reusable hook for managing asynchronous operations (API fetches).
 * Handles loading, error, data, and cleanup (aborting requests).
 */

import { useState, useEffect, useCallback, useRef } from "react";

export interface UseAsyncReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useAsync<T>(
  asyncFn: (signal?: AbortSignal) => Promise<T>,
  deps: any[] = []
): UseAsyncReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    // 1. Abort any inflight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await asyncFn(controller.signal);
      setData(result);
      setError(null);
    } catch (err: any) {
      // Don't set error if the request was intentionally aborted
      if (err.name === "AbortError") return;

      console.error("[useAsync] Execution failed:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      // Only set loading false if we're still processing the current request
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, [asyncFn]); // Rely on stable asyncFn or manual deps

  // Trigger on mount and dep changes
  useEffect(() => {
    execute();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps]);

  return { data, loading, error, reload: execute };
}
