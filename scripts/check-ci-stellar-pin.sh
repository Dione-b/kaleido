#!/usr/bin/env bash
set -euo pipefail
grep -q 'stellar/stellar-cli' .github/workflows/ci.yml || {
  echo "ci.yml must install Stellar CLI via stellar/stellar-cli action"
  exit 1
}
