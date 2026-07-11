#!/bin/bash
# SessionStart hook: install the test runner so the Playwright verification
# suite (npm test / npm run test:10x) works in Claude Code on the web.
# Browsers are provided by the environment (PLAYWRIGHT_BROWSERS_PATH), so no
# browser download is needed or attempted.
set -euo pipefail

# Only needed in the remote (web) environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# Idempotent: fast no-op when node_modules is already present and current.
npm install
