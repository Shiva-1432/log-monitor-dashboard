# LogWatch — Deployment & Launch Command Center 🚀

This is the final operational "handshake" to get your project live on the public internet.

---

## 🏗️ 1. Infrastructure Handshake (Render & Vercel)

| Service | Goal | Action |
| :--- | :--- | :--- |
| **Render (Backend)** | Connect to AWS | Ensure `render.yaml` has the exact AWS variable names. |
| **Vercel (Frontend)** | Connect to Backend | Set `NEXT_PUBLIC_BACKEND_URL` to your Render `.onrender.com` URL. |
| **Clerk (Auth)** | Allow Origins | Add your Render and Vercel domains to the Clerk **Authorized Redirect URIs**. |

---

## ⚡ 2. Final Deployment CLI Commands

Run these in your terminal to ensure the code is "Deploy Ready":

```bash
# 1. Clean verify
cd backend && npm install && npm run lint
cd ../frontend && npm install && npm run build

# 2. Local "Pre-Flight" Check
# Create your .env files and start both services
# Backend: http://localhost:4000
# Frontend: http://localhost:3000
```

---

## 🧪 3. Live Production Verification (Smoke Test)

Once your URLs are live, run the built-in system validator to confirm the "Bridge" is active:

```bash
# Verify the Render API (Health & AWS Bridge)
BACKEND_URL=https://logwatch-api.onrender.com npm run test:smoke

# Verify the Full End-to-End Simulation (Real logs & alerts)
BACKEND_URL=https://logwatch-api.onrender.com API_URL=https://aws-api-gw.com npm run test:full
```

---

## 🎛️ 4. Post-Launch: "Operations Mode"

- **Check Logs**: Monitor Render's **Dashboard > Logs** for any `[STORAGE_ERROR]` messages.
- **Verify Archival**: Navigate to the **/storage** page in the dashboard and ensure you can download a `.json` archive.
- **Test Alerting**: Run `npm run seed` and verify that a **Critical Alert** appears in the alerts tab within 10 seconds.

---

### 🎨 Design Checklist (Portfolio Ready)
- [x] **404 Page**: Verify by navigating to a fake route (`/logs/something`).
- [x] **Page Titles**: Ensure browser tabs show "Logs | LogWatch" etc.
- [x] **Shortcuts**: Press `?` in the dashboard to test the help modal.

**Congratulations! Your LogWatch project is officially "Launch Verified."** 🏆🔥
