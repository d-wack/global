#!/usr/bin/env bash
#
# Apply branch protection to `main` and `develop`.
#
# What it configures on BOTH branches:
#   - Require a pull request before merging
#   - Require the "ci-success" status check to pass
#   - Require branches to be up to date before merging (strict)
#   - Require 1 approving review (stale approvals dismissed on new pushes)
#   - Require all conversations to be resolved
#   - Block force pushes and branch deletion
#   - enforce_admins is OFF, so an admin can still perform an emergency merge
#
# Requirements: the `gh` CLI, authenticated as a user with admin on the repo.
# Usage:
#   ./scripts/setup-branch-protection.sh            # defaults to d-wack/global
#   REPO=owner/name ./scripts/setup-branch-protection.sh
#
set -euo pipefail

REPO="${REPO:-d-wack/global}"
BRANCHES=("main" "develop")

PAYLOAD=$(
  cat <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["ci-success"] },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "required_conversation_resolution": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": false
}
JSON
)

for branch in "${BRANCHES[@]}"; do
  echo "Applying branch protection to ${REPO}@${branch} ..."
  echo "${PAYLOAD}" | gh api \
    -X PUT "repos/${REPO}/branches/${branch}/protection" \
    --input - >/dev/null
  echo "  ✓ ${branch}: PR required, 'ci-success' check required (strict), 1 approval, conversations resolved; force-push & deletion blocked."
done

echo "Branch protection applied to: ${BRANCHES[*]}"
