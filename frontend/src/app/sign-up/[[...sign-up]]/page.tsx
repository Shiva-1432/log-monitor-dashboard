import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "32px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            background: "var(--green)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="5" rx="1" fill="#0d0f14" />
            <rect x="9" y="2" width="5" height="5" rx="1" fill="#0d0f14" />
            <rect x="2" y="9" width="5" height="5" rx="1" fill="#0d0f14" />
            <circle cx="11.5" cy="11.5" r="2.5" fill="#0d0f14" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.5px" }}>LogWatch</div>
          <div style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "var(--green)", letterSpacing: "1px" }}>
            REAL-TIME LOG MONITORING
          </div>
        </div>
      </div>

      <SignUp
        appearance={{
          variables: {
            colorPrimary: "#00e5a0",
            colorBackground: "#13161e",
            colorInputBackground: "#1a1e28",
            colorInputText: "#e8ecf0",
            colorText: "#e8ecf0",
            colorTextSecondary: "#8b93a8",
            colorNeutral: "#2a2f42",
            borderRadius: "10px",
            fontFamily: "Syne, sans-serif",
          },
          elements: {
            card: { border: "1px solid #2a2f42", boxShadow: "none" },
            formButtonPrimary: { background: "#00e5a0", color: "#0d0f14", fontWeight: 600 },
          },
        }}
      />
    </div>
  );
}
