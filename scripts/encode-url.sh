#!/bin/sh
# Encode a URL for use as `url_b64:` in content/internal/_index.*.md.
# Usage: scripts/encode-url.sh 'https://drive.example.com/team-folder'
set -eu
if [ $# -ne 1 ]; then
  echo "Usage: $0 '<url>'" >&2
  exit 1
fi
enc=$(printf '%s' "$1" | base64)
echo "url_b64: \"$enc\""
