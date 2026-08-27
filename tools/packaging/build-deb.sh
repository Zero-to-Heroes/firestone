#!/usr/bin/env bash
#
# Packages the native Linux Firestone build as a .deb for Debian-family distros.
#
# Hand-rolled with dpkg-deb rather than electron-builder: the repo's
# electron-builder.yml targets Windows only and its afterPack hook deletes
# non-Windows binaries, and the Overwolf builder wants network access to the
# Overwolf package servers. The Linux runtime is simple enough to assemble
# directly -- the app bundle requires exactly one native node module
# (better-sqlite3); everything else is webpacked into main.js, and the two memory
# helpers are self-contained .NET publishes.
#
# Layout mirrors dist/ so the app's own relative paths resolve unchanged:
#   /opt/firestone/apps/electron-app/       main.js, helpers, pointer tracker
#   /opt/firestone/apps/electron-frontend/  index.html (loaded via file://)
#   /opt/firestone/node_modules/            better-sqlite3 (+ bindings)
#   /opt/firestone/electron/                the ow-electron runtime
#   /usr/bin/firestone                      launcher wrapper
#
# The postinst grants CAP_SYS_PTRACE to the helper (so it can read the game's
# memory without a system-wide ptrace_scope change) and declares the runtime apt
# dependencies (x11-utils, python3-xlib) so they install automatically.
#
# Prerequisites: run `npx nx build electron-frontend && npx nx build electron-app`
# (and tools/linux-helpers/build.sh if the helpers are not staged) first.

set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
cd "$REPO"

PKG=firestone
ARCH=amd64
VERSION="$(python3 -c "import json;print(json.load(open('dist/apps/electron-app/package.json'))['version'])" 2>/dev/null || echo 0.0.0)"
OUT_DIR="$REPO/dist/executables"
STAGE="$REPO/dist/deb-build/${PKG}_${VERSION}_${ARCH}"

# ---- source artifacts -------------------------------------------------------
APP_SRC="dist/apps/electron-app"
FRONTEND_SRC="dist/apps/electron-frontend"
ELECTRON_SRC="node_modules/@overwolf/ow-electron/dist"
HELPER_REL="electron-edge-libs/mindvision-helper/FirestoneMindVisionHelper"

# ---- preflight --------------------------------------------------------------
echo ">> preflight"
err=0
[ -f "$APP_SRC/main.js" ]            || { echo "  missing $APP_SRC/main.js — run: npx nx build electron-app"; err=1; }
[ -f "$FRONTEND_SRC/index.html" ]    || { echo "  missing frontend — run: npx nx build electron-frontend"; err=1; }
[ -x "$ELECTRON_SRC/electron" ]      || { echo "  missing ow-electron runtime — run: npm ci"; err=1; }
[ -f "$APP_SRC/$HELPER_REL" ]        || { echo "  missing helper — run: tools/linux-helpers/build.sh && npx nx build electron-app"; err=1; }
[ -f "$APP_SRC/assets/linux-pointer-tracker.py" ] || { echo "  missing pointer tracker asset"; err=1; }
[ -f "node_modules/better-sqlite3/build/Release/better_sqlite3.node" ] || { echo "  missing better-sqlite3 native module — run: npm ci"; err=1; }
[ "$err" -eq 0 ] || { echo "preflight failed"; exit 1; }
echo "  ok — version $VERSION"

# ---- assemble the payload ---------------------------------------------------
echo ">> assembling payload"
rm -rf "$STAGE"
OPT="$STAGE/opt/firestone"
mkdir -p "$OPT/apps" "$OPT/node_modules" "$OPT/electron"

cp -a "$APP_SRC"      "$OPT/apps/electron-app"
cp -a "$FRONTEND_SRC" "$OPT/apps/electron-frontend"
cp -a "$ELECTRON_SRC/." "$OPT/electron/"
# better-sqlite3 + its runtime deps (prebuild-install is build-time only, omit it).
for m in better-sqlite3 bindings file-uri-to-path; do
    cp -a "node_modules/$m" "$OPT/node_modules/$m"
done

# Trim: source maps and TS are useless in a shipped build.
find "$OPT/apps" -name '*.map' -delete
find "$OPT/apps" -name '*.ts'  -delete

# The nx asset-glob can drop the execute bit; the launcher, helper and electron
# must be runnable.
chmod 0755 "$OPT/electron/electron" 2>/dev/null || true
chmod 0755 "$OPT/apps/electron-app/$HELPER_REL" 2>/dev/null || true
find "$OPT/apps/electron-app/electron-edge-libs" -maxdepth 2 -name 'Firestone*Helper' -exec chmod 0755 {} + 2>/dev/null || true

# ---- launcher wrapper -------------------------------------------------------
mkdir -p "$STAGE/usr/bin"
cat > "$STAGE/usr/bin/firestone" <<'SH'
#!/bin/bash
# Firestone native Linux launcher. Reads Hearthstone's memory via /proc and draws
# its overlay as an X11 window; the game itself runs under Wine/Proton separately.
export DISPLAY="${DISPLAY:-:0}"
exec /opt/firestone/electron/electron /opt/firestone/apps/electron-app --no-sandbox "$@"
SH
chmod 0755 "$STAGE/usr/bin/firestone"

# ---- desktop entry + icon ---------------------------------------------------
mkdir -p "$STAGE/usr/share/applications" "$STAGE/usr/share/pixmaps"
cp overwolf/launcher_icon.png "$STAGE/usr/share/pixmaps/firestone.png"
cat > "$STAGE/usr/share/applications/firestone.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Firestone
Comment=Hearthstone companion overlay (native Linux build)
Exec=firestone
Icon=firestone
Terminal=false
Categories=Game;Utility;
StartupWMClass=Firestone
EOF

# ---- control metadata -------------------------------------------------------
mkdir -p "$STAGE/DEBIAN"
INSTALLED_KB="$(du -sk "$STAGE/opt" "$STAGE/usr" | awk '{s+=$1} END{print s}')"
cat > "$STAGE/DEBIAN/control" <<EOF
Package: $PKG
Version: $VERSION
Architecture: $ARCH
Maintainer: Firestone Linux port <theowilde@live.nl>
Installed-Size: $INSTALLED_KB
Depends: x11-utils, python3, python3-xlib, libcap2-bin
Section: games
Priority: optional
Description: Firestone Hearthstone companion (native Linux)
 Native Linux build of the Firestone Hearthstone tracker. Reads the game's memory
 via /proc and renders its overlay as an ordinary X11 window, so it works against
 Hearthstone running under Wine/Proton without Overwolf or in-game D3D injection.
 .
 Requires an X11 session (not Wayland) and Hearthstone in borderless-windowed mode.
EOF

# postinst: grant ptrace to the helper and refresh desktop caches.
cat > "$STAGE/DEBIAN/postinst" <<'EOF'
#!/bin/bash
set -e
HELPER=/opt/firestone/apps/electron-app/electron-edge-libs/mindvision-helper/FirestoneMindVisionHelper
# CAP_SYS_PTRACE lets the helper read Hearthstone's /proc/<pid>/mem without setting
# kernel.yama.ptrace_scope=0 system-wide. Best effort: if the kernel already allows
# it (ptrace_scope=0) this is simply redundant.
if command -v setcap >/dev/null 2>&1 && [ -f "$HELPER" ]; then
    setcap cap_sys_ptrace+ep "$HELPER" || \
        echo "firestone: could not set cap_sys_ptrace on the helper; memory reading may need kernel.yama.ptrace_scope=0" >&2
fi
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database -q /usr/share/applications || true
fi
exit 0
EOF
chmod 0755 "$STAGE/DEBIAN/postinst"

# ---- build ------------------------------------------------------------------
echo ">> building .deb"
mkdir -p "$OUT_DIR"
DEB="$OUT_DIR/${PKG}_${VERSION}_${ARCH}.deb"
# --root-owner-group: files owned by root:root without needing fakeroot.
dpkg-deb --root-owner-group -Zxz --build "$STAGE" "$DEB" >/dev/null

echo
echo "built: $DEB"
ls -lh "$DEB" | awk '{print "  size:", $5}'
echo "install with: sudo apt install $DEB"
