#!/usr/bin/env bash
#
# Protect `main` and `develop` using a GitHub repository ruleset.
#
# Rulesets (unlike classic branch protection) are available for free on private
# repositories, and express the same requirements. This script is idempotent:
# it creates the ruleset if missing, or updates it in place if it already exists.
#
# What it enforces on BOTH branches:
#   - Require a pull request before merging (1 approval, stale approvals dismissed)
#   - Require the "ci-success" status check to pass (strict: branch up to date)
#   - Require all review conversations to be resolved
#   - Block force pushes (non-fast-forward) and branch deletion
#   - Repository admins may bypass (emergency merges) — the ruleset equivalent
#     of enforce_admins = false
#
# Requirements: the `gh` CLI, authenticated as a user with admin on the repo.
# Usage:
#   ./scripts/setup-branch-protection.sh            # defaults to d-wack/global
#   REPO=owner/name ./scripts/setup-branch-protection.sh
#
set -euo pipefail

REPO="${REPO:-d-wack/global}"
RULESET_NAME="protect-main-develop"

PAYLOAD=$(
  cat <<'JSON'
{
  "name": "protect-main-develop",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/main", "refs/heads/develop"],
      "exclude": []
    }
  },
  "bypass_actors": [
    { "actor_id": 5, "actor_type": "RepositoryRole", "bypass_mode": "always" }
  ],
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": true,
        "allowed_merge_methods": ["merge", "squash", "rebase"]
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "do_not_enforce_on_create": false,
        "required_status_checks": [{ "context": "ci-success" }]
      }
    }
  ]
}
JSON
)

# Rulesets require a public repo or a paid plan (Pro/Team) for private repos.
if ! gh api "repos/${REPO}/rulesets" >/dev/null 2>&1; then
  echo "ERROR: cannot access rulesets for ${REPO}." >&2
  echo "Branch protection / rulesets are unavailable on private repositories on the" >&2
  echo "GitHub Free plan. Either make the repo public, or upgrade to GitHub Pro/Team," >&2
  echo "then re-run this script." >&2
  exit 1
fi

# Find an existing ruleset with our name (idempotent create-or-update).
existing_id=$(gh api "repos/${REPO}/rulesets" \
  --jq "map(select(.name == \"${RULESET_NAME}\")) | .[0].id // empty")

if [[ -n "${existing_id}" ]]; then
  echo "Updating existing ruleset '${RULESET_NAME}' (id ${existing_id}) on ${REPO} ..."
  echo "${PAYLOAD}" | gh api -X PUT "repos/${REPO}/rulesets/${existing_id}" --input - >/dev/null
else
  echo "Creating ruleset '${RULESET_NAME}' on ${REPO} ..."
  echo "${PAYLOAD}" | gh api -X POST "repos/${REPO}/rulesets" --input - >/dev/null
fi

echo "  ✓ main & develop: PR required (1 approval), 'ci-success' check (strict),"
echo "    conversations resolved; force-push & deletion blocked; admins may bypass."
