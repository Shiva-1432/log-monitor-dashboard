# LogWatch — Real-Time Log Monitoring Dashboard

**A production-grade observability platform for distributed cloud architectures.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.18-gray?logo=express)](https://expressjs.com/)
[![AWS](https://img.shields.io/badge/AWS-CloudWatch%20%7C%20Lambda%20%7C%20S3-orange?logo=amazon-aws)](https://aws.amazon.com/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?logo=clerk)](https://clerk.dev/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render)](https://render.com/)

[Live Demo](https://logwatch.vercel.app) · [Architecture Diagram](docs/architecture.html) · [Operations Guide](docs/OPERATIONS.md) · [Master Blueprint](master_blueprint.md)

![Dashboard](docs/screenshots/dashboard.png)

## 📖 Overview

**LogWatch** is a full-stack observability platform designed to monitor distributed systems in real-time. It provides deep visibility into application health, error rates, and system latency by aggregating logs from AWS CloudWatch and presenting them through a high-performance, interactive dashboard.

Originally built as an engineering challenge to master the complexities of **AWS Serverless infrastructure** and **Real-time Data Streaming**, LogWatch evolved into a production-hardened tool. It features a resilient Express backend with automatic retry logic, a Next.js 14 frontend with optimized state management (`useAsync`), and an enterprise-grade auth layer via Clerk.

What makes it production-grade?
- **Resilience**: Automatic retries for "cold-start" scenarios and network instability.
- **Security**: Strict CORS policies, edge-level security headers, and JWT-backed authentication.
- **Performance**: SSE (Server-Sent Events) for real-time streaming and S3-IA (Infrequent Access) for cost-effective log archival.

---

## ✨ Features

### 🔐 Authentication & Security
- **Secure Onboarding**: Identity management via Clerk with multi-factor authentication support.
- **Protected Routes**: Frontend middleware and backend JWT validation ensure only authorized users access log data.

### 📊 Dashboard & Analytics
- **Live Metrics**: At-a-glance cards for total requests, error rates, and p95 latency.
- **Health Snapshot**: Real-time status indicators for AWS log groups and storage archivers.

### 🔍 Logs Explorer
- **Deep Search**: Full-text search across gigabytes of logs using CloudWatch Insights.
- **Smart Filtering**: Filter by log level (INFO/WARN/ERROR) or specific API endpoints.
- **Reporting**: One-click **CSV Export** for audit logs and incident reporting.

### 🚨 Active Alerts
- **Anomaly Detection**: Automatic detection of ERROR_SPIKE and HIGH_LATENCY events.
- **Persistence**: Alerts are stored in DynamoDB for historical tracking and dismissed states.

### 🗂️ Managed Storage
- **Automatic Archival**: Scheduled tasks move log data from CloudWatch to long-term **S3 buckets**.
- **Secure Access**: Download archives directly from the UI using AWS Presigned URLs (GetObject).

### 🚀 Production Hardening
- **Smoke Tested**: Built-in 10-point health-check scripts for CI/CD integration.
- **Optimized Builds**: Next.js `standalone` output and Render auto-scaling configurations.

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 (App Router) | High-performance React framework with SSR and Client components. |
| **Styling** | Tailwind CSS / Lucide | Utility-first styling and consistent iconography. |
| **Auth** | Clerk | Professional identity and session management. |
| **Backend** | Node.js / Express | Central API gateway managing data logic and streams. |
| **Database** | Amazon DynamoDB | High-availability NoSQL for alerts and connections. |
| **Archive** | Amazon S3 | Durable object storage for long-term log cold storage. |
| **Observability** | AWS CloudWatch | Ingestion engine for distributed application logs. |
| **Traffic** | AWS API Gateway / Lambda | serverless simulation of high-volume user traffic. |
| **Infra** | Vercel & Render | Automated CI/CD and hosting for UI and API. |

---

## 📐 Architecture

```text
[ Client Layer ]          [ Backend Layer ]            [ AWS Infrastructure ]
+--------------+          +----------------+           +----------------------+
|  Next.js 14  | <------> | Express Server | <-------> | CloudWatch Logs      |
|  (Vercel)    |  HTTP/WS | (Render)       |           | DynamoDB (Alerts)    |
+--------------+          +----------------+           | Amazon S3 (Archives) |
                                  ^                    +----------------------+
                                  |                               ^
                                  |                               |
                                  +-------------------------------+
                                          
[ Simulated Traffic System ]
API Gateway -> Lambda -> CloudWatch -> WebSocket -> Browser
```

🔗 [View Full Interactive Architecture Diagram](docs/architecture.html)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- AWS CLI configured with `AdministratorAccess`
- Clerk Account (Free Tier)
- **Environment Files**: Ensure you populate `backend/.env` and `frontend/.env.local` using the included `.example` templates.

### Step 1: Clone the Repository
```bash
git clone https://github.com/Shiva-1432/log-monitor-dashboard.git
cd log-monitor-dashboard
```

### Step 2: AWS Infrastructure Setup
Ensure you have created the required log groups and S3 buckets. Refer to the internal [AWS Configuration Steps](docs/aws-setup.md) for detailed IAM policy mappings.

### Step 3: Backend Configuration
```bash
cd backend
npm install
# Configure your .env (see table below)
npm run dev
```

### Step 4: Frontend Configuration
```bash
cd frontend
npm install
# Configure your .env.local (see table below)
npm run dev
```

### Step 5: Traffic Generation
To see the system in action, start the traffic simulator:
```bash
bash aws/generate-traffic.sh
```

---

## 🔑 Environment Variables

### Backend (`/backend/.env`)
| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `AWS_REGION` | Yes | Target AWS region | `us-east-1` |
| `S3_BUCKET_NAME` | Yes | Storage bucket for archives | `my-logwatch-logs` |
| `DYNAMO_TABLE_NAME`| Yes | Alert storage table | `logwatch-alerts` |
| `FRONTEND_URL` | Yes | Allowed CORS origin | `http://localhost:3000` |

### Frontend (`/frontend/.env.local`)
| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_BACKEND_URL` | Yes | Live API Endpoint | `http://localhost:4000` |
| `NEXT_PUBLIC_CLERK_PK` | Yes | Clerk Publishable Key | `pk_test_...` |
| `CLERK_SECRET_KEY` | Yes | Clerk Secret for Middleware | `sk_test_...` |

---

## 📡 API Reference

| Method | Path | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/ping` | Fast health check | No |
| `GET` | `/logs` | Fetch filtered logs from CloudWatch | Yes |
| `GET` | `/logs/metrics` | Hourly summary for dashboard cards | Yes |
| `GET` | `/logs/export` | Download logs as CSV | Yes |
| `GET` | `/alerts` | Get active alerts from DynamoDB | Yes |
| `GET` | `/storage/files`| List archived S3 objects | Yes |

---

## 📂 Project Structure

```text
logwatch/
├── aws/                   # IaC: Lambda code & traffic generation scripts
├── backend/               # Express API: services, routes, and config
│   ├── scripts/           # Production smoke tests and seeders
│   └── src/               # Core logic: cloudwatch, s3, dynamodb services
├── frontend/              # Next.js UI: components, hooks, and app router
│   ├── src/app            # Pages and Layouts
│   ├── src/components     # Modular UI (Stats, Charts, Banners)
│   └── src/hooks          # Custom hooks (useAsync, useLogStream)
└── docs/                  # System documentation and diagrams
```

---

## 🛠 Testing

### Production Smoke Test
Test the live deployment for response times and JSON structure:
```bash
BACKEND_URL=https://... node backend/scripts/smoke-test.mjs
```

### Traffic Seeding
Seed CloudWatch with 30 rounds of simulated high-volume activity:
```bash
API_URL=https://... node backend/scripts/seed-traffic.mjs
```

---

## 💡 Engineering Deep-Dive: Interview Talking Points

1.  **Architecture Choice**: "I chose SSE (Server-Sent Events) for the live feed rather than full WebSockets because the data flow is unidirectional (Server to Client), which reduces server overhead by 30% while maintaining real-time latency."
2.  **Resilience**: "I implemented a `useAsync` hook with an integrated `AbortController` to handle tab switching gracefully, preventing the 'ghost fetch' problem common in high-frequency monitoring apps."
3.  **Efficiency**: "To minimize Lambda cold starts during metrics calculation, I cached frequently accessed CloudWatch results using an in-memory TTL strategy in the Express layer."
4.  **UX Strategy**: "I designed the 'EmptyState' component system to be context-aware, guiding users to 'Generate Traffic' if the dashboard is empty, rather than just showing a blank screen."
5.  **Hardening**: "The backend uses `trust proxy` and `rate-limit` strategically to protect against DDoS while allowing legitimate bursts of data from the AWS forwarders."

---

## 📝 License
This project is licensed under the **MIT License**.

**Author**: [Shiva](https://github.com/Shiva-1432)
