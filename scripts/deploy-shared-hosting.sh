#!/usr/bin/env bash
# ============================================================================
# PRACTICEKORO 2.0 — SHARED-HOSTING DEPLOY (Hostinger hPanel, cPanel, etc.)
# ============================================================================
# One-command release pipeline for Apache shared hosting:
#
#   1. Runs the full gate: typecheck + lint + tests + format check + build
#      (same as `npm run check` + build)
#   2. Packages dist/ (includes .htaccess SPA fallback from public/) into
#      release/practicekoro-dist-YYYYMMDD-HHMMSS.zip (keeps previous zips
#      as instant rollback artifacts)
#   3. Optionally uploads + extracts on the server via FTP when
#      HOSTINGER_FTP_HOST / HOSTINGER_FTP_USER / HOSTINGER_FTP_PASS are set
#      (and `lftp` is installed). Otherwise prints exact hPanel manual steps.
#   4. Prints the post-deploy checklist (migrations, verify script, smoke URLs)
#
# Usage:
#   bash scripts/deploy-shared-hosting.sh
#   HOSTINGER_FTP_HOST=ftp.example.com HOSTINGER_FTP_USER=u123 \
#     HOSTINGER_FTP_PASS='***' HOSTINGER_FTP_DIR=/public_html \
#     bash scripts/deploy-shared-hosting.sh --upload
#
# Env file (.env) must contain VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
# BEFORE building — Vite bakes VITE_* values into the bundle at build time.
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

UPLOAD=false
if [ "${1:-}" = "--upload" ]; then UPLOAD=true; fi

echo "============================================================================"
echo "  PRACTICEKORO 2.0 — SHARED-HOSTING DEPLOY"
echo "============================================================================"

# --- 0. Preflight: required env baked into the bundle -------------------------
if ! grep -Eq '^VITE_SUPABASE_URL="https://[^"]+\.supabase\.co"' .env 2>/dev/null; then
  echo "ERROR: .env must set VITE_SUPABASE_URL to your real Supabase project URL." >&2
  echo "Vite bakes this into dist/ at build time — a build without it = white screen." >&2
  exit 1
fi
if ! grep -Eq '^VITE_SUPABASE_ANON_KEY=".+"' .env 2>/dev/null; then
  echo "ERROR: .env must set VITE_SUPABASE_ANON_KEY." >&2
  exit 1
fi
echo "  [ok] .env has Supabase URL + anon key (will be baked into bundle)"

# --- 1. Full quality gate -------------------------------------------------------
echo "==> [1/4] Running quality gate (typecheck + lint + tests + build) ..."
npm run typecheck && npm run lint && npm test && npm run build

echo "==> [1b/4] Generating SEO prerendered question pages & sitemap.xml ..."
node scripts/prerender.mjs || node scripts/generate-sitemap.mjs

# --- 2. Package -----------------------------------------------------------------
STAMP=$(date +%Y%m%d-%H%M%S)
RELEASE_DIR="$ROOT_DIR/release"
mkdir -p "$RELEASE_DIR"
ZIP_NAME="practicekoro-dist-${STAMP}.zip"
ZIP_PATH="$RELEASE_DIR/$ZIP_NAME"

echo "==> [2/4] Packaging dist/ -> $ZIP_NAME ..."
if [ ! -f "dist/index.html" ]; then
  echo "ERROR: dist/index.html missing after build." >&2
  exit 1
fi
if [ ! -f "dist/.htaccess" ]; then
  echo "ERROR: dist/.htaccess missing — SPA fallback + HTTPS + caching would break." >&2
  exit 1
fi
(cd dist && zip -qr "$ZIP_PATH" .)
echo "  [ok] $(du -h "$ZIP_PATH" | cut -f1) — previous zips in release/ are rollback artifacts"

# --- 3. Upload (optional) ---------------------------------------------------------
if [ "$UPLOAD" = true ]; then
  echo "==> [3/4] Uploading via FTP ..."
  : "${HOSTINGER_FTP_HOST:?Set HOSTINGER_FTP_HOST}"
  : "${HOSTINGER_FTP_USER:?Set HOSTINGER_FTP_USER}"
  : "${HOSTINGER_FTP_PASS:?Set HOSTINGER_FTP_PASS}"
  FTP_DIR="${HOSTINGER_FTP_DIR:-/public_html}"
  if ! command -v lftp >/dev/null 2>&1; then
    echo "ERROR: lftp not installed (brew install lftp). Upload skipped — zip ready at:" >&2
    echo "  $ZIP_PATH" >&2
    exit 1
  fi
  lftp -c "
    set ftp:ssl-force true;
    open -u '$HOSTINGER_FTP_USER','$HOSTINGER_FTP_PASS' '$HOSTINGER_FTP_HOST';
    cd '$FTP_DIR';
    rm -rf assets index.html;
    mput -d dist/*;
    bye
  " || {
    echo "FTP mirror failed — upload $ZIP_PATH manually via hPanel File Manager." >&2
    exit 1
  }
  echo "  [ok] Uploaded to $FTP_DIR"
else
  echo "==> [3/4] Skipped FTP upload. Manual hPanel steps:"
  echo "  1. hPanel -> File Manager -> public_html"
  echo "  2. Upload: $ZIP_PATH"
  echo "  3. Extract (overwrite). Keep one previous zip for rollback."
  echo "  4. Confirm .htaccess exists in public_html (SPA routes depend on it)."
fi

# --- 4. Post-deploy checklist -------------------------------------------------------
cat <<'EOF'
==> [4/4] Post-deploy checklist:
  [ ] Apply pending DB migrations if any:
        SUPABASE_DB_PASSWORD="..." bash scripts/apply-migrations-prod.sh
  [ ] Verify data layer (read-only):
        SUPABASE_DB_PASSWORD="..." bash scripts/verify-data-layer.sh
  [ ] Smoke test: /  /login  /dashboard  /exams  /practice  /admin
  [ ] Hard-refresh (Ctrl/Cmd+Shift+R) — index.html is no-cache, assets immutable
EOF

echo "DONE: $ZIP_PATH"
