# LogWatch — Operations & Maintenance Guide

This document outlines the standard procedures for maintaining, scaling, and securing the LogWatch system in a production environment.

## 🛡️ Security & Access Control

### Key Rotation
To maintain a high security posture, rotate your AWS Access Keys every 90 days.
1.  **Create** new keys in the AWS IAM Console.
2.  **Update** the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in the Render dashboard env vars.
3.  **Redeploy** the backend service.
4.  **Deactivate** the old keys in AWS once verify the new deploy is green.

### Clerk Middleware
All frontend routes are protected by Clerk. To update the allowed origins:
1.  Go to **Clerk Dashboard > Paths**.
2.  Add your new Vercel production domain to the **Authorized Redirect URIs**.

---

## 📈 Scaling & Performance

### Increasing Log History
If you need to fetch more than the default 150 logs in the explorer:
-   **Backend**: Update `LOG_FETCH_LIMIT` in `src/config.js` or through environment variables.
-   **Resource Usage**: Note that higher limits increase the execution time of CloudWatch Insights queries, which may impact your AWS bill.

### Archiver Frequency
The log archiver defaults to every 10 minutes. 
-   To change this, update `LOG_ARCHIVE_INTERVAL_MINUTES` in the Backend environment variables.
-   Valid range: `1` to `60` minutes.

---

## ☁️ AWS Resource Management

### S3 Lifecycle Policies
To manage storage costs, set an S3 Lifecycle Policy on your log bucket:
-   **Transition to IA (Infrequent Access)**: After 30 days.
-   **Expire/Delete**: After 365 days (or your compliance requirement).

### DynamoDB Throughput
The `logwatch-alerts` table uses **On-Demand** pricing by default. If you experience massive spikes in errors, ensure your AWS account limits can handle the peak Write Capacity Units (WCU).

---

## 🛠️ Troubleshooting

### "Bridge Connection" Failures
If the dashboard shows "Backend Unreachable" or "AWS Connection Failed":
1.  **Check IP Restrictions**: Ensure the Render instances aren't being blocked by an AWS WAF or SG.
2.  **Verify IAM Policy**: The IAM user must have `cloudwatch:FilterLogEvents` and `cloudwatch:GetQueryResults` permissions.
3.  **Cold Starts**: Render's free tier may sleep. The First request might take 30s+; our `test-suite.mjs` handles this with an automatic retry.

### WebSocket Fallback
The frontend is designed to automatically fallback to **SSE (Server-Sent Events)** if a WebSocket connection through Render's proxy is unstable. If you see "SSE" in the status bar instead of "WS", the system is operating in a higher-compatibility mode.
