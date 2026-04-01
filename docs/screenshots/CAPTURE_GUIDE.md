# 📸 Screenshot Capture Guide

This guide ensures your LogWatch portfolio looks professional, consistent, and highlights the right technical complexity.

### 🛠 General Setup
- **Browser Window Size**: 1440 x 900 (Desktop) / 390 x 844 (Mobile)
- **Theme**: Dark (ensure `#0d0f14` background is clean)
- **Data State**: Run `npm run seed-traffic` (3-4 times) to ensure metrics, logs, and alerts are fully populated.

---

### 1. Dashboard Overview (`dashboard-overview.png`)
- **URL**: `/`
- **State**: Metrics showing real data; live stream connected (green dot).
- **Setup**: Wait for a 5-minute window of traffic to populate the charts.
- **Highlight**: The 4 top metric cards (Total, Errors, P95, Latency) + the "Live" status pill in the top bar.
- **Annotation**: "Real-time metrics aggregated via CloudWatch Insights API."

### 2. Logs Explorer (`logs-explorer.png`)
- **URL**: `/logs`
- **State**: Filter set to `Level: ERROR` and `Endpoint: /payment`.
- **Highlight**: The red error badges in the table + a detail drawer open on one of the rows.
- **Annotation**: "Deep-dive log exploration with full-text search and endpoint filtering."

### 3. Log Details Drawer (`logs-detail-drawer.png`)
- **URL**: `/logs` (with drawer open)
- **State**: An `ERROR` log entry selected; raw JSON object visible.
- **Highlight**: The colored latency bar (red if >1000ms) + the "Copy JSON" button.
- **Annotation**: "Structured metadata extraction from CloudWatch JSON streams."

### 4. Active Alerts (`alerts-page.png`)
- **URL**: `/alerts`
- **State**: At least 2 active alerts showing (`ERROR_SPIKE` and `HIGH_LATENCY`).
- **Highlight**: The severity badges (Critical/Warning) + the mini metric bars inside cards.
- **Annotation**: "DynamoDB-backed alert persistence with automated anomaly detection."

### 5. High-Velocity Stream (`live-stream.png`)
- **URL**: `/` (Live Stream tab)
- **State**: Logs actively streaming in; new rows briefly highlighted green/glow.
- **Highlight**: The SSE connection indicator + the most recent log highlight.
- **Annotation**: "Low-latency log streaming via Server-Sent Events (SSE) / WebSockets."

### 6. Log Archival/Storage (`storage-page.png`)
- **URL**: `/storage`
- **State**: Several archived files (`.json`) visible in the table.
- **Highlight**: The "Download" button on a row + the "Running" archiver status card at the top.
- **Annotation**: "S3-IA log archival pipeline for long-term audit trail compliance."

### 7. Interactive Architecture (`architecture-diagram.png`)
- **URL**: `docs/architecture.html`
- **State**: One component box (e.g., Express) hovered to show the detailed tooltip.
- **Highlight**: Entire diagram with animated connectors visible.
- **Annotation**: "Interactive system design showing end-to-end data flow across 5 layers."

### 8. Mobile Responsiveness (`mobile-responsive.png`)
- **URL**: `/` (Dashboard)
- **Environment**: DevTools Device Toolbar set to iPhone 14 (390x844).
- **State**: Sidebar collapsed; metric cards stacked vertically.
- **Highlight**: The mobile hamburger menu + the stacked layout.
- **Annotation**: "Fully responsive engineering dashboard designed for on-call monitoring."
