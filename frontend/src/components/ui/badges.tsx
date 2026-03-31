import { LogLevel } from "@/lib/types";
import clsx from "clsx";

const levelStyles: Record<LogLevel, string> = {
  ERROR: "bg-red/15 text-red",
  WARN:  "bg-amber/15 text-amber",
  INFO:  "bg-blue/15 text-blue",
};

export function LevelBadge({ level }: { level: LogLevel }) {
  return (
    <span
      className={clsx(
        "px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wide font-mono min-w-[42px] text-center inline-block",
        levelStyles[level]
      )}
    >
      {level}
    </span>
  );
}

const statusStyles = (code: number) => {
  if (code >= 500) return "bg-red/15 text-red";
  if (code >= 400) return "bg-amber/15 text-amber";
  if (code >= 300) return "bg-blue/15 text-blue";
  return "bg-green/15 text-green";
};

export function StatusBadge({ code }: { code: number }) {
  return (
    <span
      className={clsx(
        "px-1.5 py-0.5 rounded text-[9px] font-semibold font-mono inline-block",
        statusStyles(code)
      )}
    >
      {code}
    </span>
  );
}

const severityStyles = {
  critical: "bg-red/15 text-red",
  warning:  "bg-amber/15 text-amber",
  info:     "bg-blue/15 text-blue",
};

export function SeverityBadge({ severity }: { severity: keyof typeof severityStyles }) {
  return (
    <span
      className={clsx(
        "px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-widest uppercase font-mono",
        severityStyles[severity]
      )}
    >
      {severity}
    </span>
  );
}

const methodStyles: Record<string, string> = {
  GET:    "bg-green/15 text-green",
  POST:   "bg-blue/15 text-blue",
  DELETE: "bg-red/15 text-red",
  PUT:    "bg-amber/15 text-amber",
};

export function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={clsx(
        "px-1.5 py-0.5 rounded text-[9px] font-semibold font-mono mr-1.5",
        methodStyles[method] ?? "bg-bg4 text-[--text2]"
      )}
    >
      {method}
    </span>
  );
}
