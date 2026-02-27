#!/bin/bash
set -e

BRANCH="test"
SERVER="spravce@portal.itman.cz"
SERVER_PATH="~/firma-portal"

echo "==> Pushing branch '$BRANCH' to GitHub..."
git push origin "$BRANCH"

echo "==> Deploying to $SERVER..."
ssh "$SERVER" "
  set -e
  cd $SERVER_PATH

  echo '-- git pull'
  git pull origin $BRANCH

  echo '-- npm install'
  npm install --legacy-peer-deps

  echo '-- load env and build'
  set -a && source .env && set +a
  npm run build

  echo '-- pm2 restart'
  pm2 restart firma-portal --update-env
  pm2 save

  echo '-- done'
  pm2 status
"

echo "==> Deploy dokončen!"
