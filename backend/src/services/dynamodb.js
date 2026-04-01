import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  ScanCommand, 
  DeleteCommand, 
  BatchWriteCommand 
} from "@aws-sdk/lib-dynamodb";
import config from "../config.js";

const client = new DynamoDBClient({
  region: config.aws.region,
  credentials: config.aws.credentials
});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLE_NAME = config.dynamo.tableName;


/**
 * 1. saveAlert(alert)
 * Writes an alert to DynamoDB. Adds a 7-day TTL.
 * If an alert with the same ID already exists, skips gracefully.
 */
export async function saveAlert(alert) {
  try {
    // TTL attribute must be in epoch seconds
    const expiresAt = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);

    const item = {
      ...alert,
      expiresAt,
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: "attribute_not_exists(id)" 
    }));
    
    return true;
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      // Alert already exists, jump out without crashing
      return false;
    }
    console.error(`[DynamoDB] Error saving alert (id: ${alert?.id}):`, error);
    return false;
  }
}

/**
 * 2. getAlerts({ limit = 50, severity, startTime, endTime })
 * Scans table with optional filters (severity, time range)
 * Returns array sorted by timestamp descending
 */
export async function getAlerts({ limit = 50, severity, startTime, endTime } = {}) {
  try {
    const filterExpr = [];
    const exprNames = {};
    const exprValues = {};

    if (severity) {
      filterExpr.push("#sev = :sev");
      exprNames["#sev"] = "severity";
      exprValues[":sev"] = severity;
    }

    if (startTime) {
      filterExpr.push("#ts >= :st");
      exprNames["#ts"] = "timestamp";
      exprValues[":st"] = Number(startTime);
    }

    if (endTime) {
      filterExpr.push("#ts <= :et");
      exprNames["#ts"] = "timestamp";  
      exprValues[":et"] = Number(endTime);
    }

    const commandConfig = {
      TableName: TABLE_NAME,
    };

    if (filterExpr.length > 0) {
      commandConfig.FilterExpression = filterExpr.join(" AND ");
      commandConfig.ExpressionAttributeNames = exprNames;
      commandConfig.ExpressionAttributeValues = exprValues;
    }

    // Execute scan
    const response = await docClient.send(new ScanCommand(commandConfig));
    const items = response.Items || [];

    // Sort by timestamp descending
    const sorted = items.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit limit post-sorting
    return sorted.slice(0, limit);
  } catch (error) {
    console.error("[DynamoDB] Error fetching alerts:", error);
    return []; // Return safe fallback on failure
  }
}

/**
 * 3. deleteAlert(id, timestamp)
 * Hard delete exact item by partition + sort key
 */
export async function deleteAlert(id, timestamp) {
  try {
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        id,
        timestamp: Number(timestamp)
      }
    }));
    return true;
  } catch (error) {
    console.error(`[DynamoDB] Error deleting alert (id: ${id}):`, error);
    return false;
  }
}

/**
 * 4. clearAllAlerts()
 * Scans all items and batch deletes them (BatchWriteItem accepts max 25 per request)
 */
export async function clearAllAlerts() {
  try {
    // We only need the keys to delete, limiting projection saves throughput
    const scanResponse = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      ProjectionExpression: "id, #ts",
      ExpressionAttributeNames: {
        "#ts": "timestamp"
      }
    }));

    const items = scanResponse.Items || [];
    if (items.length === 0) return 0;

    // chunk into batches of 25
    const CHUNK_SIZE = 25;
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      
      const deleteRequests = chunk.map(item => ({
        DeleteRequest: {
          Key: {
            id: item.id,
            timestamp: item.timestamp
          }
        }
      }));

      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: deleteRequests
        }
      }));
    }

    return items.length;
  } catch (error) {
    console.error("[DynamoDB] Error clearing all alerts:", error);
    return false;
  }
}
