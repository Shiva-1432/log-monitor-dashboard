import { CloudWatchLogsClient } from "@aws-sdk/client-cloudwatch-logs";
import config from "../config.js";

// Single shared client — reused across all requests
const cwClient = new CloudWatchLogsClient({
  region: config.aws.region,
  credentials: config.aws.credentials,
});

export default cwClient;

