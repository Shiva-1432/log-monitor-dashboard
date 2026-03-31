#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# generate-traffic.sh
# Fires your 3 API Gateway endpoints in a loop to generate
# realistic CloudWatch log traffic (errors + success mix).
#
# Usage:
#   chmod +x generate-traffic.sh
#   API_URL=https://YOUR_ID.execute-api.us-east-1.amazonaws.com/prod ./generate-traffic.sh
#
# Or set API_URL at the top of this file:
# ─────────────────────────────────────────────────────────────

API_URL="${API_URL:-https://REPLACE_WITH_YOUR_API_GATEWAY_URL/prod}"
ROUNDS="${ROUNDS:-20}"          # how many rounds of 3 requests

echo "🚀  Firing $ROUNDS rounds to: $API_URL"
echo "    Ctrl+C to stop early"
echo ""

for i in $(seq 1 "$ROUNDS"); do
  echo "── Round $i / $ROUNDS ──────────────────────────────"

  # POST /login
  echo -n "  /login   → "
  curl -s -o /dev/null -w "%{http_code} (%{time_total}s)\n" \
    -X POST "$API_URL/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"loadtest@logwatch.dev","password":"secret123"}'

  # POST /upload
  echo -n "  /upload  → "
  curl -s -o /dev/null -w "%{http_code} (%{time_total}s)\n" \
    -X POST "$API_URL/upload" \
    -H "Content-Type: application/json" \
    -d "{\"fileName\":\"file_$i.pdf\",\"sizeMb\":$(echo "scale=1; $RANDOM/3276" | bc)}"

  # POST /payment
  echo -n "  /payment → "
  curl -s -o /dev/null -w "%{http_code} (%{time_total}s)\n" \
    -X POST "$API_URL/payment" \
    -H "Content-Type: application/json" \
    -d "{\"amount\":$((RANDOM % 9000 + 100)),\"currency\":\"USD\"}"

  sleep 1   # 1 second between rounds
done

echo ""
echo "✅  Done — check CloudWatch Logs in AWS console"
echo "    Log groups: /aws/lambda/logwatch-login"
echo "                /aws/lambda/logwatch-upload"
echo "                /aws/lambda/logwatch-payment"
