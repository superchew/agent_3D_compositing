#!/usr/bin/env bash
set -euo pipefail

# vendor-install.sh
# Run this on a MANAGED machine to install dependencies from
# vendored tarballs without any network access.

VENDOR_DIR="vendor"
MANIFEST="$VENDOR_DIR/manifest.json"

if [ ! -f "$MANIFEST" ]; then
  echo "ERROR: $MANIFEST not found."
  echo "Run 'npm run vendor:pack' on an unrestricted machine first."
  exit 1
fi

echo "==> Reading manifest..."

# Extract tarball list from manifest
TARBALLS=$(node -e "
  const manifest = require('./$MANIFEST');
  manifest.tarballs.forEach(t => console.log(t));
")

# Build npm install command with all local tarballs
INSTALL_ARGS=""
for TARBALL in $TARBALLS; do
  INSTALL_ARGS+=" $VENDOR_DIR/$TARBALL"
done

echo "==> Installing $(echo "$TARBALLS" | wc -l | tr -d ' ') packages from vendored tarballs..."
npm install --offline $INSTALL_ARGS

echo ""
echo "==> Done! Dependencies installed from vendor/."
echo "==> Run 'npm run start:offline' to launch the dev server."
