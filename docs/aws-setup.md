# AWS Foundation: Setup & Infrastructure Guide

This guide covers the manual (or Terraform-ready) steps to configure the AWS services required for the LogWatch bridge.

---

## 🔐 1. IAM Policy: "LogWatch-Bridge-Role"
Create an IAM user for the Express backend with the following **Inline Policy**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:FilterLogEvents",
        "logs:DescribeLogGroups",
        "logs:GetLogEvents",
        "logs:GetQueryResults"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/aws/lambda/logwatch-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-logwatch-bucket",
        "arn:aws:s3:::your-logwatch-bucket/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/logwatch-alerts"
    }
  ]
}
```

---

## 📡 2. API Gateway: "Traffic-Sim-API"
1.  **Create API**: Use "REST API (Public)".
2.  **Resources**: Create `/login`, `/upload`, and `/payment`.
3.  **Methods**: Add `POST` to each, integrated with the respective Lambda functions.
4.  **Deployment**: Deploy to a stage named `prod`.
5.  **CORS**: Ensure "Enable CORS" is toggled for all resources if you plan to hit them from a browser directly (though our seed script uses Node.js).

---

## 📦 3. S3 Bucket Configuration
1.  **Bucket Name**: Must match `S3_BUCKET_NAME` in your `.env`.
2.  **CORS Policy**: Add this to allow the frontend to download files via Presigned URLs:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

---

## 🚨 4. DynamoDB Table
1.  **Table Name**: `logwatch-alerts`.
2.  **Partition Key**: `id` (String).
3.  **Sort Key**: `timestamp` (String).
4.  **Capacity**: On-Demand (Free Tier eligible).

---

## 📟 5. CloudWatch Forwarder (Optional)
If you want to forward logs from *existing* services to LogWatch, create a **CloudWatch Destination** with a Lambda subscriber that reformats your logs into our JSON schema:
```json
{
  "level": "ERROR",
  "endpoint": "/payment",
  "message": "Transaction Timeout",
  "latencyMs": 1500,
  "statusCode": 504
}
```
