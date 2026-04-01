import "dotenv/config";

const requiredEnv = [
  "AWS_REGION",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "CW_LOG_GROUP_LOGIN",
  "CW_LOG_GROUP_UPLOAD",
  "CW_LOG_GROUP_PAYMENT",
  "S3_BUCKET_NAME",
  "DYNAMO_TABLE_NAME"
];

// 1. Validation Logic
const missing = requiredEnv.filter(k => !process.env[k]);
if (missing.length > 0 && process.env.NODE_ENV === "production") {
  throw new Error(`[FATAL] Missing required production environment variables: ${missing.join(", ")}`);
} else if (missing.length > 0) {
  console.warn(`[WARNING] Missing environment variables for full AWS integration: ${missing.join(", ")}`);
}

// 2. Exported Config Object
export const config = {
  // Required
  aws: {
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  },
  cloudwatch: {
    groups: {
      login: process.env.CW_LOG_GROUP_LOGIN || "/aws/lambda/logwatch-login",
      upload: process.env.CW_LOG_GROUP_UPLOAD || "/aws/lambda/logwatch-upload",
      payment: process.env.CW_LOG_GROUP_PAYMENT || "/aws/lambda/logwatch-payment",
    },
    limit: parseInt(process.env.LOG_FETCH_LIMIT || "100", 10),
  },
  s3: {
    bucket: process.env.S3_BUCKET_NAME || "logwatch-logs-shiva",
    prefix: process.env.S3_LOG_PREFIX || "logs",
  },
  dynamo: {
    tableName: process.env.DYNAMO_TABLE_NAME || "logwatch-alerts",
  },

  // Optional / Server
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3002",
  archiveInterval: parseInt(process.env.LOG_ARCHIVE_INTERVAL_MINUTES || "10", 10),
};

export default config;
