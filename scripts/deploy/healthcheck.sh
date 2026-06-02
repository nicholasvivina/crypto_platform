#!/bin/bash
set -e
API="${API_URL:-http://localhost:5000}"
MAX=10; COUNT=0
echo "Checking health at $API/api/v1/health..."
until curl -sf "$API/api/v1/health" > /dev/null; do
  COUNT=$((COUNT+1))
  if [ $COUNT -ge $MAX ]; then echo "Health check failed after $MAX attempts"; exit 1; fi
  echo "Attempt $COUNT/$MAX — waiting 5s..."
  sleep 5
done
echo "✓ Service healthy"
