#!/bin/bash

# Deployment skript pro nahrání změn na test server
# Použití: ./deploy-to-test.sh [commit_message]

set -e  # Ukončit při chybě

# Barvy pro výstup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Server konfigurace
SERVER="portal.itman.cz"
REMOTE_DIR="/home/spravce/itmportal-test"

echo -e "${GREEN}🚀 Starting deployment to test server...${NC}"

# 1. Zkontrolovat, zda jsou změny commitnuté
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  There are uncommitted changes. Committing first...${NC}"
    
    # Přidat všechny změny
    git add .
    
    # Commit message z parametru nebo default
    COMMIT_MSG="${1:-Auto deploy to test server}"
    git commit -m "$COMMIT_MSG"
    
    echo -e "${GREEN}✅ Changes committed${NC}"
else
    echo -e "${GREEN}✅ No uncommitted changes${NC}"
fi

# 2. Push na GitHub
echo -e "${YELLOW}📤 Pushing to GitHub...${NC}"
git push origin main
echo -e "${GREEN}✅ Pushed to GitHub${NC}"

# 3. Vytvořit remote adresář pokud neexistuje
echo -e "${YELLOW}📁 Setting up remote directory...${NC}"
ssh $SERVER "mkdir -p $REMOTE_DIR"

# 4. Sync souborů na test server
echo -e "${YELLOW}📦 Syncing files to test server...${NC}"
rsync -avz --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='*.log' \
    --exclude='.env.local' \
    --exclude='dist' \
    --exclude='build' \
    ./ $SERVER:$REMOTE_DIR/

# 5. Instalace dependencies na serveru
echo -e "${YELLOW}📦 Installing dependencies on server...${NC}"
ssh $SERVER "cd $REMOTE_DIR && npm install --legacy-peer-deps"

# 6. Build aplikace
echo -e "${YELLOW}🔨 Building application...${NC}"
ssh $SERVER "cd $REMOTE_DIR && npm run build"

# 7. Restart aplikace (čistý restart)
echo -e "${YELLOW}🔄 Restarting application...${NC}"
ssh $SERVER "cd $REMOTE_DIR && pm2 delete itmportal-test 2>/dev/null || true"
ssh $SERVER "cd $REMOTE_DIR && pm2 start npm --name itmportal-test -- start"

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Test server: https://portal.itman.cz${NC}"
