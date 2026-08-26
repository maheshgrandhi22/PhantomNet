#!/bin/bash
echo "--- Checking Git Status ---"
git status
echo ""
read -p "Enter your daily progress commit message: " msg
if [ -z "$msg" ]; then
  echo "Commit message cannot be empty. Aborting."
  exit 1
fi
git add .
git commit -m "docs/update: $msg"
echo "--- Pushing to GitHub ---"
git push origin main
echo "Done! Your daily progress has been successfully committed and pushed."
