import "dotenv/config";
import express      from "express";
import cors         from "cors";
import helmet       from "helmet";
import morgan       from "morgan";
import rateLimit    from "express-rate-limit";

import logsRouter   from "./routes/logs.js";
import alertsRouter from "./routes/alerts.js";
import healthRouter from "./routes/health.js";

const app  = express();
const PORT = process.env.PORT ?? 4000;

// ── Security ──────────────────────────────────────────────────
app.use(helmet());

// ── CORS — allow Next.js frontend ─────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL ?? "http://localhost:3000",
    "http://localhost:3000",  // always allow local dev
  ],
  methods:     ["GET", "POST", "OPTIONS"],
  credentials: true,
}));

// ── Rate limiting — prevent hammering CloudWatch API ─────────
const limiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max:      60,          // 60 req/min per IP
  message:  { error: "Too many requests, slow down." },
});
app.use(limiter);

// ── Body parsing + logging ─────────────────────────────────────
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── Routes ─────────────────────────────────────────────────────
app.use("/health", healthRouter);
app.use("/logs",   logsRouter);
app.use("/alerts", alertsRouter);

// ── 404 catch-all ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[Unhandled Error]", err);
  res.status(500).json({ error: "Internal server error", detail: err.message });
});

// ── Start ───────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   LogWatch Backend — running on :${PORT}   ║
╠══════════════════════════════════════════╣
║  GET  /health          → AWS status      ║
║  GET  /logs            → fetch logs      ║
║  GET  /logs/metrics    → dashboard stats ║
║  GET  /alerts          → active alerts   ║
╚══════════════════════════════════════════╝
  `);
});

export default app;
