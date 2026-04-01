import express      from "express";
import path         from "path";
import cors         from "cors";
import helmet       from "helmet";
import morgan       from "morgan";
import rateLimit    from "express-rate-limit";
import compression  from "compression";
import timeout      from "connect-timeout";

import config       from "./config.js";
import logsRouter   from "./routes/logs.js";
import alertsRouter from "./routes/alerts.js";
import healthRouter from "./routes/health.js";
import streamRouter from "./routes/stream.js";
import storageRouter from "./routes/storage.js";
import { startArchiver } from "./services/archiver.js";

const app  = express();
const PORT = config.port;

// ── Production Hardening ───────────────────────────────────────
app.set("trust proxy", 1); // Trust Render's proxy
app.use(compression());     // Gzip compression for all responses
app.use(timeout("30s"));    // Request timeout
app.use(helmet());          // Security headers

// ── CORS — allow configured frontend ──────────────────────────
app.use(cors({
  origin: [
    config.frontendUrl,
    "http://localhost:3000",
  ],
  methods:     ["GET", "POST", "DELETE", "OPTIONS"],
  credentials: true,
}));

// ── Rate limiting ──────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max:      config.nodeEnv === "production" ? 30 : 60,
  message:  { error: "Too many requests, slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ── Body parsing + logging ─────────────────────────────────────
app.use(express.json());
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));

// ── Status Check ───────────────────────────────────────────────
// Fast health-check for Render/load balancers
app.get("/ping", (_req, res) => res.status(200).json({ status: "ok" }));

// ── Routes ─────────────────────────────────────────────────────
app.use("/health",  healthRouter);
app.use("/logs",    logsRouter);
app.use("/alerts",  alertsRouter);
app.use("/stream",  streamRouter);
app.use("/storage", storageRouter);

// ── Debug / Local Download ─────────────────────────────────────
app.get("/api/debug/download", (req, res) => {
  if (!config.isMockMode) return res.status(403).json({ error: "Debug endpoint disabled" });
  const key = req.query.key;
  if (!key) return res.status(400).json({ error: "Key required" });
  
  const localPath = path.join(process.cwd(), "tmp", key);
  res.download(localPath);
});

// ── 404 catch-all ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ────────────────────────────────────────
app.use((err, req, res, _next) => {
  const isProd = config.nodeEnv === "production";
  const statusCode = err.status || err.statusCode || 500;
  
  if (statusCode === 500) {
    console.error(`[INTERNAL_ERROR] ${new Date().toISOString()} | ${req.method} ${req.path} | ${err.message}`);
    if (!isProd) console.error(err.stack);
  }

  res.status(statusCode).json({
    error: isProd && statusCode === 500 ? "Internal system error" : err.message,
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// ── Start ───────────────────────────────────────────────────────
const archiverInterval = config.archiveInterval;
startArchiver(archiverInterval);

const server = app.listen(PORT, () => {
  const mode = config.nodeEnv.toUpperCase();
  const border = "═".repeat(50);
  console.log(`
  ╔${border}╗
  ║ LOGWATCH BACKEND — NODE SERVICE RUNNING          ║
  ╠${border}╣
  ║  PORT: ${PORT.toString().padEnd(42)}║
  ║  MODE: ${mode.padEnd(42)}║
  ║  MOCK DATA: ${(config.isMockMode ? "Enabled (AWS Offline)" : "Disabled").padEnd(35)}║
  ║  ARCHIVER: Enabled (${archiverInterval} min interval)      ║
  ║  HEALTH: http://localhost:${PORT}/ping             ║
  ╚${border}╝
  `);
});

// ── Graceful Shutdown ──────────────────────────────────────────
process.on("SIGTERM", () => {
  console.log("[SIGTERM] Received. Shutting down gracefully...");
  
  // Close the server first (stops accepting new connections)
  server.close(() => {
    console.log("Closed all active HTTP connections. Process exiting.");
    process.exit(0);
  });

  // Force shutdown after 10 seconds fallback
  setTimeout(() => {
    console.error("Could not close connections in time, forcefully shutting down.");
    process.exit(1);
  }, 10000);
});

export default app;

