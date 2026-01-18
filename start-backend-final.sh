#!/bin/bash
set -e
cd /tmp/TestDemo/backend
echo "Starting backend from $(pwd)..."
exec npx ts-node --transpile-only src/server.ts
