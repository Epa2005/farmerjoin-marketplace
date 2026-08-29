#!/usr/bin/env bash
# Simple helper to add, commit, and push current repo to a remote GitHub URL.
# Usage: ./git_push.sh "Commit message" "https://github.com/owner/repo.git" [branch]

set -euo pipefail

MSG=${1:-"Apply fixes: routing and image URL"}
REPO_URL=${2:-"https://github.com/Epa2005/farmerjoin-marketplace.git"}
BRANCH=${3:-main}

echo "Repository URL: $REPO_URL"
echo "Branch: $BRANCH"
echo "Commit message: $MSG"

if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -m "$MSG" || true
else
  echo "No changes to commit. Proceeding to push remote only."
fi

if git remote | grep -q ^origin$; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

git branch -M "$BRANCH"
git push -u origin "$BRANCH"

echo "Pushed to $REPO_URL on branch $BRANCH"
