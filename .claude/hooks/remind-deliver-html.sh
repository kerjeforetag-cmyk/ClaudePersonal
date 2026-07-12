#!/usr/bin/env bash
# Stop hook: whenever the presentation HTML has changed since it was last
# delivered, remind Claude to hand the file to the user and refresh the
# artifact link. Fires at most once per unique file version (a content-hash
# sentinel is advanced each time it fires), so it never loops.
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || pwd)}"
HTML="$ROOT/Kasper_Kerje_Resan_Hub.html"
SENT="$ROOT/.claude/.last-delivered-html"

# Nothing to do if the presentation isn't there.
[ -f "$HTML" ] || exit 0

H="$(sha1sum "$HTML" | cut -d' ' -f1)"
S="$(cat "$SENT" 2>/dev/null || echo none)"

if [ "$H" != "$S" ]; then
  # Mark this version as handled so the reminder shows exactly once.
  printf '%s' "$H" > "$SENT" 2>/dev/null || true
  reason="Kasper_Kerje_Resan_Hub.html has changed since it was last delivered. Before you stop: (1) send the current file to the user with SendUserFile (files: [\"Kasper_Kerje_Resan_Hub.html\"], display: \"attach\"); and (2) refresh the artifact by calling Artifact with the same file_path so the shareable link stays the same. Then you may stop."
  jq -n --arg r "$reason" '{decision:"block", reason:$r}'
  exit 0
fi

exit 0
