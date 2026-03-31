# LogWatch — Real-Time Log Monitoring Dashboard

## Project Structure

```
logwatch/
├── frontend/                  ← Next.js 14 app (Phases 1 + 2 + 4)
│   ├── package.json           ← includes @clerk/nextjs + recharts
│   ├── tailwind.config.ts
│   ├── next.config.mjs
│   ├── tsconfig.json
│   ├── .env.local.example     ← copy to .env.local and fill in
│   └── src/
│       ├── middleware.ts       ← Clerk auth protection
│       ├── app/
│       │   ├── layout.tsx                         ← ClerkProvider wrapper
│       │   ├── globals.css                        ← CSS variables + fonts
│       │   ├── page.tsx                           ← Dashboard (real metrics)
│       │   ├── (dashboard)/layout.tsx             ← Sidebar layout wrapper
│       │   ├── logs/page.tsx                      ← Logs Explorer
│       │   ├── alerts/page.tsx                    ← Alerts
│       │   ├── api-monitor/page.tsx               ← API Monitor
│       │   ├── settings/page.tsx                  ← Settings
│       │   ├── sign-in/[[...sign-in]]/page.tsx    ← Clerk sign-in
│       │   └── sign-up/[[...sign-up]]/page.tsx    ← Clerk sign-up
│       ├── components/
│       │   ├── Sidebar.tsx     ← nav + Clerk UserButton
│       │   ├── Topbar.tsx      ← live clock + status pill
│       │   └── ui/badges.tsx   ← LevelBadge, StatusBadge, MethodBadge
│       └── lib/
│           ├── api.ts          ← typed fetch client for Express backend
│           └── dummy-data.ts   ← fallback dummy data
│
├── backend/                   ← Express server (Phase 4)
│   ├── package.json
│   ├── .env.example           ← copy to .env and fill in
│   └── src/
│       ├── server.js           ← entry point, routes, middleware
│       ├── lib/
│       │   └── aws.js          ← CloudWatch client singleton
│       ├── routes/
│       │   ├── logs.js         ← GET /logs, GET /logs/metrics
│       │   ├── alerts.js       ← GET /alerts
│       │   └── health.js       ← GET /health
│       └── services/
│           ├── cloudwatch.js   ← fetch + parse CloudWatch logs
│           └── alerts.js       ← alert detection logic
│
└── aws/                       ← Lambda functions + IAM (Phase 3)
    ├── lambda/
    │   ├── login/index.mjs     ← POST /login Lambda (~15% error rate)
    │   ├── upload/index.mjs    ← POST /upload Lambda (~30% error rate)
    │   └── payment/index.mjs   ← POST /payment Lambda (~30% error rate)
    ├── iam/
    │   ├── lambda-execution-policy.json    ← attach to Lambda role
    │   └── backend-cloudwatch-policy.json  ← attach to backend IAM user
    ├── test-local.mjs          ← test Lambda logic locally
    └── generate-traffic.sh     ← fire endpoints to seed CloudWatch logs
```

---

## Quick Start

### Step 1 — AWS (Phase 3)
```bash
# Test Lambda logic locally first
node aws/test-local.mjs

# Then deploy to AWS — see aws/README in each phase zip for console steps
# After deployment, seed logs:
API_URL=https://YOUR_ID.execute-api.us-east-1.amazonaws.com/prod \
  bash aws/generate-traffic.sh
```

### Step 2 — Backend
```bash
cd backend
npm install
cp .env.example .env       # fill in AWS keys + log group names
npm run dev                # starts on http://localhost:4000

# Verify:
curl http://localhost:4000/health
curl http://localhost:4000/logs
```

### Step 3 — Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in Clerk keys + backend URL
npm run dev                         # starts on http://localhost:3000
```

---

## Environment Variables

### frontend/.env.local
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

### backend/.env
```env
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
CW_LOG_GROUP_LOGIN=/aws/lambda/logwatch-login
CW_LOG_GROUP_UPLOAD=/aws/lambda/logwatch-upload
CW_LOG_GROUP_PAYMENT=/aws/lambda/logwatch-payment
LOG_FETCH_LIMIT=100
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Recharts |
| Auth | Clerk |
| Backend | Express.js, AWS SDK v3 |
| Logs | AWS CloudWatch Logs |
| APIs | AWS API Gateway + Lambda |
| Fonts | JetBrains Mono, Syne |

---

## Build Progress

- [x] Phase 1 — UI Foundation (5 pages, dark terminal theme)
- [x] Phase 2 — Authentication (Clerk login + route protection)
- [x] Phase 3 — AWS Setup (3 Lambda functions + API Gateway + CloudWatch)
- [x] Phase 4 — Express Backend (/logs, /alerts, /health APIs)
- [ ] Phase 5 — Advanced Logs Explorer
- [ ] Phase 6 — Alert Persistence (DynamoDB)
- [ ] Phase 7 — Real-time Streaming (WebSocket)
- [ ] Phase 8 — Log Storage (S3)
- [ ] Phase 9 — Deployment (Vercel + Render)
- [ ] Phase 10 — Docs + Testing
