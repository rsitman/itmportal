#!/bin/bash
set -e

BRANCH="test"
SERVER="spravce@portal.itman.cz"
SERVER_PATH="~/firma-portal"
KNOWN_HOSTS_FILE="/home/oak/.ssh/known_hosts"
GITHUB_SSH_IDENTITY_FILE="/home/oak/.ssh/itmportal2"
PORTAL_SSH_IDENTITY_FILE="/home/oak/.ssh/portal_itman"

echo "==> Pushing branch '$BRANCH' to GitHub..."
GIT_SSH_COMMAND="ssh -o UserKnownHostsFile=${KNOWN_HOSTS_FILE} -i ${GITHUB_SSH_IDENTITY_FILE} -o IdentitiesOnly=yes" git push origin "$BRANCH"

echo "==> Deploying to $SERVER..."
ssh -o UserKnownHostsFile=${KNOWN_HOSTS_FILE} -i ${PORTAL_SSH_IDENTITY_FILE} -o IdentitiesOnly=yes "$SERVER" "
  set -e
  cd $SERVER_PATH

  echo '-- git stash (pokud jsou lokální změny)'
  git stash --include-untracked 2>/dev/null || true

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
