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
deploy_commit="$(git rev-parse HEAD)"

npm test
npm run build

# Publish source first. The target pulls and builds the exact delivered commit.
git push origin HEAD:main
ssh "$deploy_host" "set -eu
  cd '${deploy_repo}'
  test \"\$(git branch --show-current)\" = main
  test -z \"\$(git status --porcelain)\"
  git pull --ff-only origin main
  test \"\$(git rev-parse HEAD)\" = '${deploy_commit}'
  npm ci
  npm test
  npm run build
  install -d -m 0755 '${web_root}/releases/${release}'
  cp -R dist/. '${web_root}/releases/${release}/'
  chmod -R u=rwX,go=rX '${web_root}/releases/${release}'
  ln -s 'releases/${release}' '${web_root}/.current-${release}'
  mv -Tf '${web_root}/.current-${release}' '${web_root}/current'
  test \"\$(git rev-parse HEAD)\" = '${deploy_commit}'
"

printf 'Deployed release %s to https://docsheet.infiniter.tech\n' "$release"
