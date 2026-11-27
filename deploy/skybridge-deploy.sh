#!/usr/bin/env bash
set -euo pipefail

exec 9>/var/lock/skybridge-deploy.lock
flock 9

cd /opt/skybridge
git pull --ff-only
docker compose up -d --build --remove-orphans
docker image prune -f
echo "Deployed $(git rev-parse --short HEAD)"