# 🎤 5-Minute Project Demo Script

This script is designed for technical interviews or professional presentations. It follows a narrative of "Observe → Analyze → Resolve."

---

### **00:00 — The "Elevator Pitch"**
**[Open the Live Dashboard URL]**
> "Hi, I'm Shiva. This is LogWatch—a real-time observability platform I built to monitor distributed cloud systems. The goal was to solve the problem of fragmented logging by aggregating data from across multiple AWS services into a single, high-performance command center."

### **00:30 — The "Dashboard & Ingestion"**
**[Point to the 4 Top Metric Cards]**
> "At the top, we see our primary system health KPIs: Total Requests, Error Rate, and P95 Latency. These aren't just static numbers; they're live-calculated stats. My Express backend uses CloudWatch Insights queries to aggregate thousands of serverless logs into these summarized metrics every minute."

### **01:00 — The "Logs Explorer"**
**[Navigate to /logs, Filter: ERROR + /payment]**
> "If a metric like 'Error Rate' spikes, I can jump into the Logs Explorer. Here, I've implemented a custom filtering engine. Let's filter for all `ERROR` logs specifically on the `/payment` endpoint. This lets us isolate problematic code paths instantly without manual grepping."

### **01:30 — The "Data Structure"**
**[Click a row to open the Detail Drawer]**
> "Expanding a row reveals the raw JSON metadata. One technical decision I made was to normalize disparate log formats from several AWS Lambda functions into a single, unified schema. This makes for a much smoother debugging experience regardless of which service failed."

### **02:00 — The "Search Engine"**
**[Type "timeout" into the search bar]**
> "I also built in a full-text search. Even if I don't know the endpoint, searching for 'timeout' hits our backend's regex engine to find exactly where our system is hanging under load."

### **02:30 — The "Alert Detection"**
**[Navigate to /alerts]**
> "But engineers shouldn't have to watch the dashboard 24/7. That's where the Alert Management comes in. I'm using DynamoDB to persist anomaly detection results like `ERROR_SPIKE` and `HIGH_LATENCY` events."

### **03:00 — The "Automated Logic"**
**[Point at an Alert Card]**
> "Each alert card here represents a detected failure. When my backend detects that the error rate has crossed a sliding window threshold, it writes a critical event to DynamoDB, which then propagates to this UI in real-time."

### **03:30 — The "Persistence & Archival"**
**[Navigate to /storage]**
> "For long-term compliance, we can't keep everything in CloudWatch forever. I built a log archival pipeline that periodically moves log sets to Amazon S3. From here, we can browse historical archives and download them via secure Presigned URLs for post-mortem analysis."

### **04:00 — The "Real-Time Streaming"**
**[Navigate back to / (Dashboard), Live Stream tab]**
> "Finally, let's look at the Live Stream. To achieve this low-latency feed, I implemented a combination of Server-Sent Events (SSE) and WebSockets. As traffic hits our AWS gateway, it's forwarder here in less than 500ms."

### **04:30 — The "Architectural Overview"**
**[Navigate to /docs/architecture.html]**
> "To wrap up, this interactive diagram shows the full 5-layer flow: from the Next.js frontend, through the Express middleware on Render, and finally into the AWS ecosystem where CloudWatch, S3, and DynamoDB handle the heavy lifting."

### **05:00 — The "Conclusion"**
> "LogWatch was an exercise in building for scale and resilience. If I were to continue, the next phase would be adding direct Slack/Email integrations for these alerts. Thanks for watching!"
