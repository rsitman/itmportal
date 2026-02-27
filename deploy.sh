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
  echo '-- npm build'
  npm run build
  echo '-- pm2 restart'
  pm2 restart itmportal-test --update-env
  echo '-- done'
  pm2 list
"

echo "==> Deploy dokončen!"
