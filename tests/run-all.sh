#!/usr/bin/env bash
# Runs every suite against ../index.html. Requires only node.
cd "$(dirname "$0")" || exit 1
command -v node >/dev/null || {
  echo "node is not on PATH. If you use fnm, run this from a shell where fnm has initialised."
  exit 1
}
total=0; bad=0
for f in *-test.js; do
  out=$(node "$f" 2>&1); rc=$?
  n=$(printf '%s' "$out" | grep -oE '[0-9]+ passed' | tail -1 | grep -oE '^[0-9]+')
  total=$((total + ${n:-0}))
  line=$(printf '%s' "$out" | grep -E '[0-9]+ passed, [0-9]+ failed|no illegal deck' | tail -1)
  if [ $rc -ne 0 ] || printf '%s' "$out" | grep -q 'FAIL'; then
    bad=$((bad+1)); printf '  %-22s %s\n' "$f" "${line:-CRASHED}"
    printf '%s\n' "$out" | grep -E 'FAIL|Error' | head -5 \
      || printf '%s\n' "$out" | head -3   # nothing matched — show why it died
  else
    printf '  %-22s %s\n' "$f" "${line:-ok}"
  fi
done
echo
echo "  $total assertions across $(ls *-test.js | wc -l | tr -d ' ') suites, $bad failing"
exit $((bad > 0))
