import { Router } from "express";
import { checkLogGroupsExist } from "../services/cloudwatch.js";

const router = Router();

/**
 * GET /health
 *
 * Returns server status + AWS CloudWatch connectivity check.
 * Used by Render (Phase 9) for health pings.
 */
router.get("/", async (_req, res) => {
  const start = Date.now();

  let awsStatus  = "ok";
  let logGroups  = [];
  let awsError   = null;

  try {
    logGroups = await checkLogGroupsExist();
  } catch (err) {
    awsStatus = "error";
    awsError  = err.message;
  }

  res.json({
    status:    "ok",
    uptime:    process.uptime(),
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - start,
    aws: {
      status:    awsStatus,
      region:    process.env.AWS_REGION ?? "us-east-1",
      logGroups,
      error:     awsError,
    },
  });
});

export default router;
