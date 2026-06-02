#!/bin/bash
set -e
echo "Deploying CryptoNex to EC2..."
git pull origin main
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d --remove-orphans
docker system prune -f
node scripts/db/indexes.js
bash scripts/deploy/healthcheck.sh
echo "✓ Deployment complete"
