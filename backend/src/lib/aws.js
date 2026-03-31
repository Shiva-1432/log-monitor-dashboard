import { CloudWatchLogsClient } from "@aws-sdk/client-cloudwatch-logs";

// Single shared client — reused across all requests
const cwClient = new CloudWatchLogsClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export default cwClient;
