import zlib from "zlib";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";

const REGION = process.env.AWS_REGION || "us-east-1";
const TABLE_NAME = process.env.DYNAMO_TABLE_CONNECTIONS || "logwatch-connections";

// Note: CloudWatch triggers don't provide the API Gateway endpoint in the event.
// You MUST set this environment variable (e.g., https://xxxxxx.execute-api.us-east-1.amazonaws.com/production)
const WEBSOCKET_ENDPOINT = process.env.WEBSOCKET_ENDPOINT;

const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

let apigwClient;

export const handler = async (event) => {
  if (!event.awslogs || !event.awslogs.data) {
    console.warn("No CloudWatch log data found in event payload");
    return;
  }

  // 1. Decompress and decode the base64 gzipped log data
  const payload = Buffer.from(event.awslogs.data, "base64");
  const unzipped = zlib.gunzipSync(payload);
  const logData = JSON.parse(unzipped.toString("utf-8"));

  // 2. Parse and filter log events
  const parsedLogs = [];
  for (const logEvent of logData.logEvents) {
    const raw = logEvent.message?.trim() || "";
    
    // Skip standard AWS Lambda runtime tags
    if (/^(START|END|REPORT|INIT_START)/.test(raw)) continue;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { message: raw, level: "INFO" };
    }

    parsedLogs.push({
      id: logEvent.id,
      timestamp: logEvent.timestamp,
      ...parsed,
      raw
    });
  }

  // Abort early if there's no actionable data
  if (parsedLogs.length === 0) return;

  // 3. Initialize API Gateway Management API Client
  if (!apigwClient && WEBSOCKET_ENDPOINT) {
    apigwClient = new ApiGatewayManagementApiClient({
      endpoint: WEBSOCKET_ENDPOINT,
      region: REGION,
    });
  } else if (!apigwClient) {
    console.error("FATAL: WEBSOCKET_ENDPOINT environment variable is not defined");
    return;
  }

  // 4. Retrieve all active connections mapped in DynamoDB
  const connections = [];
  let lastEvaluatedKey;
  do {
    const scanRes = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        ProjectionExpression: "connectionId",
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );
    if (scanRes.Items) {
      connections.push(...scanRes.Items);
    }
    lastEvaluatedKey = scanRes.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  if (connections.length === 0) return;

  // 5. Blast out the parsed logs iteratively to all connections
  const postPromises = connections.map(async ({ connectionId }) => {
    if (!connectionId) return;

    try {
      // Loop over the logs natively and broadcast each line like an SSE event or send as a combined broadcast
      // Emitting individually replicates the local SSE behavior neatly:
      for (const singleLog of parsedLogs) {
        await apigwClient.send(
          new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: Buffer.from(JSON.stringify(singleLog)),
          })
        );
      }
    } catch (err) {
      if (err.statusCode === 410 || err.name === "GoneException") {
        console.log(`Connection ${connectionId} is dead. Cleaning from DynamoDB...`);
        await docClient.send(
          new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { connectionId },
          })
        );
      } else {
        console.error(`Failed pushing to connection ${connectionId}:`, err);
      }
    }
  });

  await Promise.allSettled(postPromises);
};
