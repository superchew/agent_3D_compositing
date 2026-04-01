#!/usr/bin/env bash
set -euo pipefail

# vendor-install.sh
# Run this on a MANAGED machine to install dependencies offline.
#
# Supports two modes:
#   1. Archive mode: extracts vendor/node_modules.tar.gz (fastest)
#   2. Tarball mode: installs from vendor/tarballs/*.tgz files
#
# Archive mode is preferred — use vendor-pack.sh to create it.
# Tarball mode is a fallback — use download-deps.sh to get tarballs.

VENDOR_DIR="vendor"
ARCHIVE="$VENDOR_DIR/node_modules.tar.gz"
TARBALL_DIR="$VENDOR_DIR/tarballs"

if [ -f "$ARCHIVE" ]; then
  echo "==> Found node_modules archive. Extracting..."
  rm -rf node_modules
  tar xzf "$ARCHIVE"
  echo ""
  echo "==> Done! Dependencies installed from archive."
  echo "==> Run 'npm run start:offline' to launch the dev server."

elif [ -d "$TARBALL_DIR" ] && ls "$TARBALL_DIR"/*.tgz >/dev/null 2>&1; then
  COUNT=$(ls "$TARBALL_DIR"/*.tgz | wc -l | tr -d ' ')
  echo "==> Found $COUNT tarballs in $TARBALL_DIR. Installing..."

  # Build space-separated list of all tarball paths
  INSTALL_ARGS=""
  for TARBALL in "$TARBALL_DIR"/*.tgz; do
    INSTALL_ARGS+=" $TARBALL"
  done

  npm install --legacy-peer-deps --offline $INSTALL_ARGS
  echo ""
  echo "==> Done! Dependencies installed from tarballs."
  echo "==> Run 'npm run start:offline' to launch the dev server."

else
  echo "ERROR: No vendor data found."
  echo ""
  echo "Expected one of:"
  echo "  $ARCHIVE          (from vendor-pack.sh on unrestricted machine)"
  echo "  $TARBALL_DIR/*.tgz (from download-deps.sh)"
  echo ""
  echo "See scripts/ for setup instructions."
  exit 1
fi
