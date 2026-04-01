import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";
import config from "../config.js";

const REGION = config.aws.region;
const BUCKET_NAME = config.s3.bucket;
const PREFIX = config.s3.prefix;

const s3Client = new S3Client({ 
  region: REGION,
  credentials: config.aws.credentials
});


/**
 * Helper to stream GetObject body to string
 */
async function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
}

/**
 * 1. buildS3Key(endpoint, timestamp)
 * Example: logs/2026/03/31/logwatch-payment-1422-1743428400000.json
 */
export function buildS3Key(endpoint, timestamp = Date.now()) {
  const d = new Date(timestamp);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const mins = String(d.getUTCMinutes()).padStart(2, "0");
  
  // Clean endpoint: "/payment" -> "payment"
  const cleanEndpoint = endpoint.replace(/^\//, "") || "all";
  
  return `${PREFIX}/${year}/${month}/${day}/logwatch-${cleanEndpoint}-${hours}${mins}-${timestamp}.json`;
}

/**
 * 2. saveLogsToS3(logs, endpoint)
 */
export async function saveLogsToS3(logs, endpoint) {
  try {
    if (!logs || logs.length === 0) return null;

    if (endpoint === "all") {
      // Group by endpoint
      const grouped = {};
      for (const log of logs) {
        const ep = log.endpoint || "/unknown";
        if (!grouped[ep]) grouped[ep] = [];
        grouped[ep].push(log);
      }

      const results = [];
      for (const [ep, epLogs] of Object.entries(grouped)) {
        const res = await saveLogsToS3(epLogs, ep);
        if (res) results.push(res);
      }
      return results.length > 0 ? results : null;
    }

    const now = Date.now();
    const key = buildS3Key(endpoint, now);
    const count = logs.length;

    const payload = {
      savedAt: now,
      endpoint,
      count,
      logs,
    };

    if (config.isMockMode) {
      const localPath = path.join(process.cwd(), "tmp", key);
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(localPath, JSON.stringify(payload, null, 2));
      console.info(`[S3-Mock] Saved logs locally to: ${localPath}`);
      return { key, bucket: "local-fs", count, savedAt: now };
    }

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(payload),
        ContentType: "application/json",
      })
    );

    return { key, bucket: BUCKET_NAME, count, savedAt: now };
  } catch (error) {
    console.error("[S3] Failed to save logs:", error);
    return null;
  }
}

/**
 * 3. listLogFiles({ endpoint, date, limit = 20 })
 */
export async function listLogFiles({ endpoint, date, limit = 20 } = {}) {
  try {
    const d = date ? new Date(date) : new Date();
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");

    const prefixPath = `${PREFIX}/${year}/${month}/${day}/`;

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefixPath,
      MaxKeys: limit,
    });

    const response = await s3Client.send(command);
    if (!response.Contents) return [];

    const cleanEndpoint = endpoint ? endpoint.replace(/^\//, "") : null;

    let files = response.Contents.map((obj) => {
      // Extract endpoint from key if possible
      const match = obj.Key.match(/logwatch-(.+)-\d{4}-\d+\.json$/);
      const ep = match ? `/${match[1]}` : null;

      return {
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        endpoint: ep,
        date: d.toISOString().split("T")[0],
      };
    });

    if (cleanEndpoint && cleanEndpoint !== "all") {
      files = files.filter((f) => f.key.includes(`logwatch-${cleanEndpoint}-`));
    }

    // Return newest first based on lastModified
    files.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    return files.slice(0, limit);
  } catch (error) {
    console.error("[S3] Failed to list log files:", error);
    return null;
  }
}

/**
 * 4. getLogFile(key)
 */
export async function getLogFile(key) {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
    
    const bodyStr = await streamToString(response.Body);
    const parsed = JSON.parse(bodyStr);
    return {
      logs: parsed.logs || [],
      count: parsed.count || (parsed.logs ? parsed.logs.length : 0),
      savedAt: parsed.savedAt || null,
      endpoint: parsed.endpoint || "unknown"
    };
  } catch (error) {
    console.error("[S3] Failed to get log file:", error);
    return null;
  }
}

/**
 * 5. generateDownloadUrl(key, expiresInSeconds = 300)
 */
export async function generateDownloadUrl(key, expiresInSeconds = 300) {
  try {
    if (config.isMockMode) {
      // Return a path that the local server can serve via a static route or special endpoint
      return { url: `/api/debug/download?key=${key}`, expiresAt: "never", key };
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    return { url, expiresAt, key };
  } catch (error) {
    console.error("[S3] Failed to generate download URL:", error);
    return null;
  }
}

/**
 * 6. deleteLogFile(key)
 */
export async function deleteLogFile(key) {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
    return { deleted: true, key };
  } catch (error) {
    console.error("[S3] Failed to delete log file:", error);
    return null;
  }
}
