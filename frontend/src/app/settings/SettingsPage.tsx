"use client";

import { useState } from "react";
import Topbar from "@/components/Topbar";

function Toggle({ initial = false }: { initial?: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <button
      onClick={() => setOn(!on)}
      className="w-9 h-5 rounded-full relative border-none cursor-pointer flex-shrink-0 transition-colors"
      style={{ background: on ? "var(--green)" : "var(--bg4)" }}
    >
      <span
        className="absolute top-[3px] w-3.5 h-3.5 bg-white rounded-full transition-all"
        style={{ left: on ? "19px" : "3px" }}
      />
    </button>
  );
}

const inputStyle = {
  background: "var(--bg3)",
  border: "1px solid var(--border)",
  borderRadius: 5,
  padding: "4px 8px",
  color: "var(--text)",
  fontFamily: "JetBrains Mono, monospace",
  fontSize: 11,
  width: 90,
  outline: "none",
};

interface SettingRowProps {
  label: string;
  sub: string;
  control: React.ReactNode;
}

function SettingRow({ label, sub, control }: SettingRowProps) {
  return (
    <div
      className="flex items-center justify-between py-2"
      style={{ borderBottom: "1px solid rgba(42,47,66,0.5)" }}
    >
      <div>
        <div className="text-[12px]">{label}</div>
        <div className="text-[10px] font-mono mt-0.5" style={{ color: "var(--text3)" }}>{sub}</div>
      </div>
      {control}
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
    >
      <div
        className="text-[11px] font-mono tracking-wide uppercase mb-3"
        style={{ color: "var(--text2)" }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <Topbar title="Settings" />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-2 gap-3">

          <Section title="Alert Thresholds">
            <SettingRow label="Error Rate Trigger"   sub="% above which alerts fire"    control={<input style={inputStyle} defaultValue="30"       type="number" />} />
            <SettingRow label="Latency P95 Limit"    sub="ms threshold"                 control={<input style={inputStyle} defaultValue="800"      type="number" />} />
            <SettingRow label="Alert Cooldown"       sub="minutes between same alert"   control={<input style={inputStyle} defaultValue="5"        type="number" />} />
          </Section>

          <Section title="Log Streaming">
            <SettingRow label="Live WebSocket"    sub="real-time log streaming"     control={<Toggle initial={true}  />} />
            <SettingRow label="Auto-scroll Logs"  sub="follow new entries"          control={<Toggle initial={true}  />} />
            <SettingRow label="Sound Alerts"      sub="critical error audio cue"    control={<Toggle initial={false} />} />
          </Section>

          <Section title="AWS Integration">
            <SettingRow label="CloudWatch Region" sub="log source region"           control={<input style={{ ...inputStyle, width: 100 }} defaultValue="us-east-1" type="text" />} />
            <SettingRow label="DynamoDB Alerts"   sub="persist alerts to table"     control={<Toggle initial={true}  />} />
            <SettingRow label="S3 Log Archive"    sub="store historical logs"       control={<Toggle initial={false} />} />
          </Section>

          <Section title="Notifications">
            <SettingRow label="Email Alerts"   sub="critical alerts via email"   control={<Toggle initial={true}  />} />
            <SettingRow label="Slack Webhook"  sub="post to #alerts channel"     control={<Toggle initial={false} />} />
            <SettingRow label="PagerDuty"      sub="on-call escalation"          control={<Toggle initial={false} />} />
          </Section>

        </div>

        {/* Save button */}
        <div className="mt-4 flex justify-end">
          <button
            className="text-[12px] font-semibold font-mono px-5 py-2 rounded-lg cursor-pointer transition-colors"
            style={{ background: "var(--green)", color: "#0d0f14" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--green2)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--green)")}
          >
            save settings
          </button>
        </div>
      </div>
    </div>
  );
}
