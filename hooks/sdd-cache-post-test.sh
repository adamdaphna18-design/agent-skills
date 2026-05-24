#!/bin/bash
# sdd-cache-post-test.sh — Tests for extract_header in sdd-cache-post.sh
#
# Run: bash hooks/sdd-cache-post-test.sh

set -euo pipefail

PASS=0 FAIL=0

assert_eq() {
  local label="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    PASS=$((PASS + 1))
    printf '  PASS: %s\n' "$label"
  else
    FAIL=$((FAIL + 1))
    printf '  FAIL: %s\n' "$label" >&2
    printf '    expected: [%s]\n' "$expected" >&2
    printf '    actual:   [%s]\n' "$actual" >&2
  fi
}

# The logic we are testing, extracted/adapted from hooks/sdd-cache-post.sh
# We wrap it in a function that takes the raw HEAD output and the header name.
test_extract() {
  local RAW_HEAD_OUT="$1"
  local name="$2"
  local FINAL_HEADERS

  # Logic from line 71: strip CR
  local HEAD_OUT
  HEAD_OUT=$(printf '%s' "$RAW_HEAD_OUT" | tr -d '\r')

  # Logic from line 76-80: extract last paragraph
  FINAL_HEADERS=$(printf '%s' "$HEAD_OUT" | awk '
    BEGIN { RS = ""; last = "" }
    { last = $0 }
    END { print last }
  ')

  # Logic from line 82-93 (extract_header function body)
  printf '%s' "$FINAL_HEADERS" | awk -v h="$name" '
    BEGIN { FS = ":" }
    tolower($1) == tolower(h) {
      sub(/^[^:]*:[ \t]*/, "")
      sub(/[ \t]+$/, "")
      print
      exit
    }
  '
}

printf 'Test 1: Basic header extraction\n'
HEADERS="HTTP/1.1 200 OK
Content-Type: text/html
ETag: \"12345\"
Last-Modified: Wed, 21 Oct 2015 07:28:00 GMT"

assert_eq "extract ETag" "\"12345\"" "$(test_extract "$HEADERS" "ETag")"
assert_eq "extract Last-Modified" "Wed, 21 Oct 2015 07:28:00 GMT" "$(test_extract "$HEADERS" "Last-Modified")"

printf '\nTest 2: Case insensitivity\n'
assert_eq "extract etag (lowercase)" "\"12345\"" "$(test_extract "$HEADERS" "etag")"
assert_eq "extract ETAG (uppercase)" "\"12345\"" "$(test_extract "$HEADERS" "ETAG")"

printf '\nTest 3: Whitespace trimming\n'
HEADERS_WS="HTTP/1.1 200 OK
ETag:   \"spaced\"
X-Custom:   value with spaces inside   "

assert_eq "trim leading/trailing spaces" "\"spaced\"" "$(test_extract "$HEADERS_WS" "ETag")"
assert_eq "preserve internal spaces" "value with spaces inside" "$(test_extract "$HEADERS_WS" "X-Custom")"

printf '\nTest 4: Redirect chain (multiple paragraphs)\n'
# Simulated curl -I -L output with a 301 followed by a 200
HEADERS_REDIR="HTTP/1.1 301 Moved Permanently
Location: https://example.com/new
ETag: \"old\"

HTTP/1.1 200 OK
Content-Type: text/plain
ETag: \"new\""

assert_eq "extract ETag from the final response" "\"new\"" "$(test_extract "$HEADERS_REDIR" "ETag")"

printf '\nTest 5: Missing header\n'
assert_eq "missing header returns empty" "" "$(test_extract "$HEADERS" "X-Non-Existent")"

printf '\nTest 6: Multiple headers with same name (pick first in final block)\n'
# While unusual for ETag, some headers can repeat. extract_header exits after first match.
HEADERS_MULTI="HTTP/1.1 200 OK
Set-Cookie: a=1
Set-Cookie: b=2"
assert_eq "pick first Set-Cookie" "a=1" "$(test_extract "$HEADERS_MULTI" "Set-Cookie")"

printf '\nTest 7: CRLF line endings (typical for HTTP)\n'
HEADERS_CRLF=$'HTTP/1.1 200 OK\r\nETag: "abc"\r\nLast-Modified: Wed, 21 Oct 2015 07:28:00 GMT\r\n\r\n'
assert_eq "extract ETag with CRLF" "\"abc\"" "$(test_extract "$HEADERS_CRLF" "ETag")"
assert_eq "extract Last-Modified with CRLF" "Wed, 21 Oct 2015 07:28:00 GMT" "$(test_extract "$HEADERS_CRLF" "Last-Modified")"

# ── Summary ──────────────────────────────────────────────────────────────
printf '\n══════════════════════════════════════════\n'
printf 'Results: %d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
