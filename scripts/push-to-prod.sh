#!/usr/bin/env bash
# scripts/push-to-prod.sh
# Final step: push the v2.2.0 (Bun switch) commit to GitHub and prepare the on-chain deploy.
#
# Run this yourself (it requires your SSH key passphrase and your
# DEPLOYER_PRIVATE_KEY — both of which the AI assistant cannot supply).
#
# Usage:
#   bash scripts/push-to-prod.sh
#
# This script does NOT execute the on-chain deploy (that needs your wallet).
# After it finishes, follow the steps in docs/PROD_DEPLOY.md §2.3.

set -euo pipefail
cd "$(dirname "$0")/.."

echo "═══════════════════════════════════════════════════════════════"
echo "  Step 1/4: Verify all CI gates are green"
echo "═══════════════════════════════════════════════════════════════"
bash scripts/check-all.sh

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Step 2/4: Confirm the commit is in place"
echo "═══════════════════════════════════════════════════════════════"
git log -1 --oneline
git status --short
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "  Step 3/4: Push to GitHub (origin/main)"
echo "═══════════════════════════════════════════════════════════════"
echo "You will be prompted for your SSH key passphrase."
echo ""
git push origin main
echo ""
echo "✅ Pushed to GitHub. The CI workflow will run automatically."
echo "   Watch: https://github.com/enriquesouza/replay-tracking/actions"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Step 4/4: On-chain deploy (manual — needs your keys)"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Now set these in your shell (or .env):"
echo ""
echo "  export RPC_URL=\"https://your-rpc.example.com\""
echo "  export DEPLOYER_PRIVATE_KEY=\"0x...\""
echo "  export ETHERSCAN_API_KEY=\"...\"   # optional, for auto-verify"
echo ""
echo "Then run the full prod-deploy runbook:"
echo ""
echo "  cat docs/PROD_DEPLOY.md          # read the full runbook"
echo "  bash scripts/check-all.sh        # verify gates are still green"
echo "  npm run health:rpc               # confirm RPC is reachable"
echo "  npm run balance:check            # confirm wallet is funded"
echo "  npm run deploy:prod              # or: npm run deploy:verify"
echo ""
echo "After the deploy, set CONTRACT_ADDRESS in .env and restart the API."
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  All done!"
echo "═══════════════════════════════════════════════════════════════"
