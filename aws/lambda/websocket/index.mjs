import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";

const REGION = process.env.AWS_REGION || "us-east-1";
const TABLE_NAME = process.env.DYNAMO_TABLE_CONNECTIONS || "logwatch-connections";

const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

export const handler = async (event) => {
  const routeKey = event.requestContext?.routeKey;
  const connectionId = event.requestContext?.connectionId;

  if (!routeKey || !connectionId) {
    // Return 200 gracefully even if malformed request
    console.warn("Missing routeKey or connectionId in request context");
    return { statusCode: 200, body: "Ignored" };
  }

  try {
    switch (routeKey) {
      case "$connect":
        await handleConnect(connectionId);
        break;
      case "$disconnect":
        await handleDisconnect(connectionId);
        break;
      case "$default":
        await handleDefault(event);
        break;
      default:
        console.warn(`Unhandled routeKey: ${routeKey}`);
        break;
    }
  } catch (error) {
    console.error(`Error handling ${routeKey} for connection ${connectionId}:`, error);
    // Handle all errors gracefully — never return 5xx to API Gateway WebSocket
  }

  return { statusCode: 200, body: "OK" };
};

async function handleConnect(connectionId) {
  const now = Date.now();
  // ttl: now + 2hrs (DynamoDB expects seconds for TTL)
  const ttl = Math.floor(now / 1000) + 2 * 60 * 60;

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        connectionId,
        connectedAt: now,
        ttl,
      },
    })
  );
  console.log(`Stored new connection: ${connectionId}`);
}

async function handleDisconnect(connectionId) {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        connectionId,
      },
    })
  );
  console.log(`Deleted stale/disconnected connection: ${connectionId}`);
}

async function handleDefault(event) {
  const domainName = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  const endpoint = `https://${domainName}/${stage}`;

  const apigwClient = new ApiGatewayManagementApiClient({
    endpoint,
    region: REGION,
  });

  // Get all active connectionIds from DynamoDB
  let connections = [];
  let lastEvaluatedKey = undefined;

  // Paginate through scan to ensure we get all connections
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

  if (connections.length === 0) {
    console.log("No active connections found to broadcast to.");
    return;
  }

  // Node.js Buffer is required for Data payload in AWS SDK v3
  const dataBytes = Buffer.from(JSON.stringify(event.body));

  const postPromises = connections.map(async ({ connectionId }) => {
    try {
      await apigwClient.send(
        new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: dataBytes,
        })
      );
    } catch (err) {
      // If posting fails with 410 (GoneException) -> delete that connectionId
      if (err.statusCode === 410 || err.name === "GoneException") {
        console.log(`Connection ${connectionId} returned 410 Gone. Cleaning up...`);
        await handleDisconnect(connectionId);
      } else {
        console.error(`Failed to broadcast to ${connectionId}:`, err);
      }
    }
  });

  await Promise.allSettled(postPromises);
}
