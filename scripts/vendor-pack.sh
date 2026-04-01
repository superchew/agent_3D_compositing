#!/usr/bin/env bash
set -euo pipefail

# vendor-pack.sh
# Run this on an UNRESTRICTED machine to create the vendor/ bundle.
#
# Two modes:
#   1. If node_modules exists: archive it directly
#   2. If node_modules is empty: run npm install first, then archive
#
# The resulting vendor/ directory can be copied to managed machines.

VENDOR_DIR="vendor"
ARCHIVE="$VENDOR_DIR/node_modules.tar.gz"

if [ ! -d "node_modules" ] || [ -z "$(find node_modules -maxdepth 2 -type f 2>/dev/null | head -1)" ]; then
  echo "==> node_modules is empty or missing. Installing dependencies..."
  npm install --legacy-peer-deps
fi

echo "==> Cleaning vendor directory..."
rm -rf "$VENDOR_DIR"
mkdir -p "$VENDOR_DIR"

echo "==> Archiving node_modules (this may take a moment)..."
tar czf "$ARCHIVE" node_modules

# Also copy package-lock.json for reproducibility
cp package-lock.json "$VENDOR_DIR/package-lock.json" 2>/dev/null || true

# Write manifest
node -e "
  const fs = require('fs');
  const stats = fs.statSync('$ARCHIVE');
  const manifest = {
    generatedAt: new Date().toISOString(),
    archiveSizeMB: (stats.size / 1024 / 1024).toFixed(1),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  };
  fs.writeFileSync('$VENDOR_DIR/manifest.json', JSON.stringify(manifest, null, 2));
"

SIZE=$(du -sh "$ARCHIVE" | cut -f1)
echo ""
echo "==> Done! Archived node_modules to $ARCHIVE ($SIZE)"
echo "==> Manifest written to $VENDOR_DIR/manifest.json"
echo ""
echo "Next steps:"
echo "  1. Copy this project folder (including vendor/) to the managed machine"
echo "  2. On the managed machine, run: npm run vendor:install"
echo "  3. Then run: npm run start:offline"
