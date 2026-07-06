#!/bin/bash
# PreToolUse (matcher: Bash) — ats-platform project overlay.
# Forces a confirmation prompt (not a hard block) for the specific actions
# this repo's CLAUDE.md Safety Rules section calls out as needing
# confirmation first: prisma migrate reset/deploy, flushing Redis, and
# running the prod docker-compose.yml. These are legitimate actions that
# are sometimes genuinely needed, unlike the universally-destructive
# patterns already hard-denied by the global block-dangerous-bash.sh
# hook (~/.claude/hooks/) — both hooks fire on every Bash call since
# Claude Code merges hooks across scopes instead of overriding.

INPUT=$(cat)

COMMAND=$(node -e "
let data='';
process.stdin.on('data', c => data += c);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    process.stdout.write(input.tool_input && input.tool_input.command ? input.tool_input.command : '');
  } catch (e) {
    process.stdout.write('');
  }
});
" <<< "$INPUT")

ASK_PATTERNS=(
  'prisma[[:space:]]+migrate[[:space:]]+(reset|deploy)'
  'redis-cli[^\n]*[[:space:]](flushall|flushdb)'
  '\b(FLUSHALL|FLUSHDB)\b'
  '(-f|--file)[[:space:]]+docker-compose\.yml\b'
)

for pattern in "${ASK_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern"; then
    cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "ask",
    "permissionDecisionReason": "This repo's CLAUDE.md Safety Rules section flags this as needing confirmation first (matched: $pattern)."
  }
}
EOF
    exit 0
  fi
done

exit 0
