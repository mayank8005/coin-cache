#!/bin/sh
set -e

echo "[coin-cache] running prisma migrate deploy..."
node node_modules/prisma/build/index.js migrate deploy --schema=prisma/schema.prisma

exec "$@"
