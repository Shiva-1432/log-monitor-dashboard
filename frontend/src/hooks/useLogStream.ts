import { useState, useEffect, useCallback, useRef } from "react";
import config from "../lib/config";
import type { LogEntry } from "../lib/types";

export interface UseLogStreamOptions {
  maxLogs?: number;
  onNewLog?: (log: LogEntry) => void;
  enabled?: boolean;
  wsUrl?: string;
}

export function useLogStream({
  maxLogs = 200,
  onNewLog,
  enabled: initialEnabled = true,
  wsUrl,
}: UseLogStreamOptions = {}) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [newLogIds, setNewLogIds] = useState<Set<string>>(new Set());
  const [connected, setConnected] = useState<boolean>(false);
  const [connectionType, setConnectionType] = useState<"sse" | "websocket" | "disconnected">("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<boolean>(initialEnabled);

  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isWsConnectedRef = useRef(false);

  const clearLogs = useCallback(() => setLogs([]), []);
  const pause = useCallback(() => setEnabled(false), []);
  const resume = useCallback(() => setEnabled(true), []);

  const handleNewLog = useCallback(
    (logMsg: LogEntry) => {
      // 1. Prepend exactly to the beginning and assert buffer scale bounds natively (maxLogs)
      setLogs((prev) => {
        const newLogs = [logMsg, ...prev].slice(0, maxLogs);
        return newLogs;
      });

      // 2. Add ID accurately to hot highlight tracker Set
      setNewLogIds((prev) => {
        const updated = new Set(prev);
        updated.add(logMsg.id);
        return updated;
      });

      // 3. Remove seamlessly matching React lifecycle cleanly after 3 seconds
      setTimeout(() => {
        setNewLogIds((prev) => {
          const updated = new Set(prev);
          updated.delete(logMsg.id);
          return updated;
        });
      }, 3000);

      if (onNewLog) {
        onNewLog(logMsg);
      }
    },
    [maxLogs, onNewLog]
  );

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    isWsConnectedRef.current = false;
    setConnected(false);
    setConnectionType("disconnected");
  }, []);

  const connect = useCallback(
    (tryWebsocket = true) => {
      if (!enabled) return;

      disconnect();

      const backendUrl = config.backendUrl;

      const handleReconnect = (retryWs = false) => {
        if (reconnectCountRef.current >= 5) {
          setError("AWS Pulse Check Failed: Please verify your backend .env credentials.");
          setConnected(false);
          setConnectionType("disconnected");
          return;
        }
        
        // Exponential backoff: 3s, 6s, 12s, 24s...
        const delay = 3000 * Math.pow(2, reconnectCountRef.current);
        reconnectCountRef.current += 1;
        setError(`Reconnecting in ${delay / 1000}s...`);

        reconnectTimeoutRef.current = setTimeout(() => {
          connect(retryWs);
        }, delay);
      };

      // == WEBSOCKET STRATEGY =============================================
      if (wsUrl && tryWebsocket) {
        try {
          const ws = new WebSocket(wsUrl);
          wsRef.current = ws;

          ws.onopen = () => {
            isWsConnectedRef.current = true;
            setConnected(true);
            setConnectionType("websocket");
            setError(null);
            reconnectCountRef.current = 0; // Reset metrics upon active link
          };

          ws.onmessage = (event) => {
            try {
              const logMsg = JSON.parse(event.data) as LogEntry;
              handleNewLog(logMsg);
            } catch (e) {
              // Fail silently in prod for malformed chunks
            }
          };

          ws.onerror = () => {
            // Error handled by onclose logic
          };

          ws.onclose = () => {
            wsRef.current = null;
            setConnected(false);
            setConnectionType("disconnected");
            
            if (!isWsConnectedRef.current) {
              connect(false); // Fallback to SSE
            } else {
              isWsConnectedRef.current = false;
              handleReconnect(true);
            }
          };
          return;
        } catch (e) {
          connect(false);
        }
      }

      // == SSE STRATEGY (FALLBACK) =========================================
      try {
        const sse = new EventSource(`${backendUrl}/stream/logs`);
        eventSourceRef.current = sse;

        sse.onopen = () => {
          setConnected(true);
          setConnectionType("sse");
          setError(null);
          reconnectCountRef.current = 0;
        };

        sse.addEventListener("connected", () => {
          // Standard pipeline handshake parsed correctly
        });

        // 3. Heartbeat monitor ping event logic
        sse.addEventListener("heartbeat", () => {
           // We can track last-seen explicitly if needed.
        });

        sse.addEventListener("log", (event: any) => {
          try {
            const logMsg = JSON.parse(event.data) as LogEntry;
            handleNewLog(logMsg);
          } catch (e) {
            // Ignore malformed SSE chunks
          }
        });

        sse.addEventListener("error", (event: any) => {
          sse.close();
          eventSourceRef.current = null;
          setConnected(false);
          setConnectionType("disconnected");
          
          if (event.data) {
            try {
              const errData = JSON.parse(event.data);
              if (errData.message) setError(errData.message);
            } catch {}
          }
          
          // Force internal custom backoff reconnect loop instead of EventSource standard looping
          handleReconnect(false);
        });
      } catch (err) {
        console.error("SSE engine initialization failed fundamentally:", err);
      }
    },
    [enabled, wsUrl, handleNewLog, disconnect]
  );

  // Mount/Unmount effect bindings
  useEffect(() => {
    if (enabled) {
      connect(true);
    } else {
      disconnect();
    }
    return () => disconnect();
  }, [enabled, connect, disconnect]);

  // Sync internal state explicitly when disabled manually by the consumer
  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  return {
    logs,
    newLogIds,
    connected,
    connectionType,
    error,
    clearLogs,
    pause,
    resume,
  };
}
