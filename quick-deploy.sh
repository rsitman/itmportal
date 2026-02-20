#!/bin/bash

# Rychlý deployment skript - jen sync souborů
# Použití: ./quick-deploy.sh

echo "🚀 Quick deploy to test server..."

# Sync souborů na test server
rsync -avz --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='*.log' \
    --exclude='.env*' \
    --exclude='dist' \
    --exclude='build' \
    ./ portal.itman.cz:/home/spravce/itmportal-test/

echo "✅ Files synced to test server"
