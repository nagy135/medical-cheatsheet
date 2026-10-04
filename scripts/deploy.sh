#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -n "$(git status --porcelain)" ]]; then
  printf '%s\n' 'Commit your changes before deploying.' >&2
  exit 1
fi

deploy_host="${DOCSHEET_DEPLOY_HOST:-infiniter@nixpi.tail6650cb.ts.net}"
deploy_repo='/home/infiniter/services/medical-cheatsheet'
web_root='/var/www/docsheet'
release="$(git rev-parse --short=12 HEAD)-$(date -u +%Y%m%dT%H%M%SZ)"

npm test
npm run build

# Transfer committed source; preserve the Pi checkout's provider remote.
git push "ssh://${deploy_host}${deploy_repo}" HEAD:main

ssh "$deploy_host" "install -d -m 0755 '${web_root}/releases/${release}'"
rsync -az dist/ "${deploy_host}:${web_root}/releases/${release}/"

# Previous releases remain available for rollback.
ssh "$deploy_host" "chmod -R u=rwX,go=rX '${web_root}/releases/${release}' && ln -s 'releases/${release}' '${web_root}/.current-${release}' && mv -Tf '${web_root}/.current-${release}' '${web_root}/current'"

printf 'Deployed release %s to https://docsheet.infiniter.tech\n' "$release"
