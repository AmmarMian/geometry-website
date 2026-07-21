#!/bin/sh
# Hash a password for use as `password_hash:` in data/site.yaml.
# Usage: scripts/hash-password.sh 'newpassword'
set -eu
if [ $# -ne 1 ]; then
  echo "Usage: $0 '<password>'" >&2
  exit 1
fi
hash=$(printf '%s' "$1" | shasum -a 256 | awk '{print $1}')
echo "password_hash: $hash"
