#!/usr/bin/env bash
set -euo pipefail

# vendor-pack.sh
# Run this on an UNRESTRICTED machine to pack all npm dependencies
# into vendor/ for offline installation on managed machines.

VENDOR_DIR="vendor"
MANIFEST="$VENDOR_DIR/manifest.json"

echo "==> Ensuring node_modules is up to date..."
npm install

echo "==> Cleaning vendor directory..."
rm -rf "$VENDOR_DIR"
mkdir -p "$VENDOR_DIR"

echo "==> Packing dependencies..."

# Read all dependency names from package.json (both dependencies and devDependencies)
DEPS=$(node -e "
  const pkg = require('./package.json');
  const all = {
    ...pkg.dependencies,
    ...pkg.devDependencies
  };
  console.log(Object.keys(all).join('\n'));
")

MANIFEST_ENTRIES="["
FIRST=true

for DEP in $DEPS; do
  echo "  Packing $DEP..."
  # npm pack outputs the tarball filename to stdout
  TARBALL=$(npm pack "$DEP" --pack-destination "$VENDOR_DIR" 2>/dev/null)

  if [ "$FIRST" = true ]; then
    FIRST=false
  else
    MANIFEST_ENTRIES+=","
  fi
  MANIFEST_ENTRIES+="\"$TARBALL\""
done

MANIFEST_ENTRIES+="]"

echo "$MANIFEST_ENTRIES" | node -e "
  const fs = require('fs');
  let data = '';
  process.stdin.on('data', chunk => data += chunk);
  process.stdin.on('end', () => {
    const tarballs = JSON.parse(data);
    const manifest = {
      generatedAt: new Date().toISOString(),
      packageCount: tarballs.length,
      tarballs: tarballs
    };
    fs.writeFileSync('$MANIFEST', JSON.stringify(manifest, null, 2));
  });
"

echo ""
echo "==> Done! Packed $(echo "$DEPS" | wc -l | tr -d ' ') packages into $VENDOR_DIR/"
echo "==> Manifest written to $MANIFEST"
echo ""
echo "Next steps:"
echo "  1. Copy this project folder (including vendor/) to the managed machine"
echo "  2. On the managed machine, run: npm run vendor:install"
echo "  3. Then run: npm run start:offline"
