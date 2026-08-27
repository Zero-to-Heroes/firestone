#!/usr/bin/env bash
#
# Build a portable, distro-agnostic tarball of the native Linux Firestone build.
#
# The .deb (tools/packaging/build-deb.sh) only installs on Debian-family systems.
# This produces firestone-<version>-linux-x64.tar.gz with the same /opt payload plus
# a self-contained install.sh that works on any glibc distro: it installs the runtime
# prerequisites through whichever package manager is present (apt / dnf / pacman /
# zypper), copies the app into place, and grants the ptrace capability.
#
# The app itself is already distro-neutral: Electron, self-contained .NET helpers, and
# a prebuilt better-sqlite3 -- nothing links against distro-specific libraries beyond a
# baseline glibc + X11.
#
# Prerequisites: run `npx nx build electron-frontend && npx nx build electron-app`
# (and tools/linux-helpers/build.sh if the helpers are not staged) first.

set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
cd "$REPO"

PKG=firestone
VERSION="$(python3 -c "import json;print(json.load(open('dist/apps/electron-app/package.json'))['version'])" 2>/dev/null || echo 0.0.0)"
NAME="${PKG}-${VERSION}-linux-x64"
OUT_DIR="$REPO/dist/executables"
STAGE="$REPO/dist/tarball-build/$NAME"

APP_SRC="dist/apps/electron-app"
FRONTEND_SRC="dist/apps/electron-frontend"
ELECTRON_SRC="node_modules/@overwolf/ow-electron/dist"
HELPER_REL="electron-edge-libs/mindvision-helper/FirestoneMindVisionHelper"

echo ">> preflight"
err=0
[ -f "$APP_SRC/main.js" ]            || { echo "  missing $APP_SRC/main.js — run: npx nx build electron-app"; err=1; }
[ -f "$FRONTEND_SRC/index.html" ]    || { echo "  missing frontend — run: npx nx build electron-frontend"; err=1; }
[ -x "$ELECTRON_SRC/electron" ]      || { echo "  missing ow-electron runtime — run: npm ci"; err=1; }
[ -f "$APP_SRC/$HELPER_REL" ]        || { echo "  missing helper — run: tools/linux-helpers/build.sh && npx nx build electron-app"; err=1; }
[ -f "node_modules/better-sqlite3/build/Release/better_sqlite3.node" ] || { echo "  missing better-sqlite3 — run: npm ci"; err=1; }
[ "$err" -eq 0 ] || { echo "preflight failed"; exit 1; }
echo "  ok — version $VERSION"

echo ">> assembling payload"
rm -rf "$STAGE"
OPT="$STAGE/opt/firestone"
mkdir -p "$OPT/apps" "$OPT/node_modules" "$OPT/electron"

cp -a "$APP_SRC"      "$OPT/apps/electron-app"
cp -a "$FRONTEND_SRC" "$OPT/apps/electron-frontend"
cp -a "$ELECTRON_SRC/." "$OPT/electron/"
for m in better-sqlite3 bindings file-uri-to-path; do
    cp -a "node_modules/$m" "$OPT/node_modules/$m"
done
find "$OPT/apps" -name '*.map' -delete
find "$OPT/apps" -name '*.ts'  -delete
chmod 0755 "$OPT/electron/electron" 2>/dev/null || true
find "$OPT/apps/electron-app/electron-edge-libs" -maxdepth 2 -name 'Firestone*Helper' -exec chmod 0755 {} + 2>/dev/null || true

# Wrapper, desktop entry, icon -- staged under usr/ so install.sh can drop them into place.
mkdir -p "$STAGE/usr/bin" "$STAGE/usr/share/applications" "$STAGE/usr/share/pixmaps"
cat > "$STAGE/usr/bin/firestone" <<'SH'
#!/bin/bash
# Firestone native Linux launcher.
export DISPLAY="${DISPLAY:-:0}"
exec /opt/firestone/electron/electron /opt/firestone/apps/electron-app --no-sandbox "$@"
SH
chmod 0755 "$STAGE/usr/bin/firestone"
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

# Ship the Steam / dual-launcher next to the app too.
cp "$HERE/firestone-battlenet.sh" "$STAGE/firestone-battlenet.sh"
chmod 0755 "$STAGE/firestone-battlenet.sh"

echo ">> writing install.sh / uninstall.sh"
cat > "$STAGE/install.sh" <<'INSTALL'
#!/usr/bin/env bash
# Install Firestone (native Linux) on any distro. Run from the extracted tarball:
#   ./install.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"

if [ "$(id -u)" -eq 0 ]; then SUDO=""; else SUDO="sudo"; fi

echo ">> installing runtime prerequisites"
# Needed at runtime: xprop/xwininfo (x11 utils), python3 + python-xlib (pointer
# tracker), setcap (from libcap). Package names differ per distro.
if command -v apt-get >/dev/null 2>&1; then
    $SUDO apt-get update -qq
    $SUDO apt-get install -y x11-utils python3 python3-xlib libcap2-bin
elif command -v dnf >/dev/null 2>&1; then
    $SUDO dnf install -y xorg-x11-utils python3 python3-xlib libcap
elif command -v pacman >/dev/null 2>&1; then
    $SUDO pacman -S --needed --noconfirm xorg-xprop python python-xlib libcap
elif command -v zypper >/dev/null 2>&1; then
    $SUDO zypper install -y xprop python3 python3-python-xlib libcap-progs
else
    echo "!! unknown package manager. Install manually, then re-run:"
    echo "     xprop/xwininfo, python3 + python-xlib, and setcap (libcap)"
fi

echo ">> copying files into /"
$SUDO cp -a "$HERE/opt/." /opt/
$SUDO cp -a "$HERE/usr/." /usr/
# Optional dual-launcher for Steam shortcuts.
$SUDO install -m 0755 "$HERE/firestone-battlenet.sh" /usr/bin/firestone-battlenet 2>/dev/null || true

echo ">> granting CAP_SYS_PTRACE to the memory helper"
HELPER=/opt/firestone/apps/electron-app/electron-edge-libs/mindvision-helper/FirestoneMindVisionHelper
SETCAP="$(command -v setcap || echo /usr/sbin/setcap)"
if [ -x "$SETCAP" ] && [ -f "$HELPER" ]; then
    $SUDO "$SETCAP" cap_sys_ptrace+ep "$HELPER" || \
        echo "!! setcap failed. Fallback: sudo sysctl -w kernel.yama.ptrace_scope=0"
else
    echo "!! setcap not found. Fallback: sudo sysctl -w kernel.yama.ptrace_scope=0"
fi

command -v update-desktop-database >/dev/null 2>&1 && \
    $SUDO update-desktop-database -q /usr/share/applications 2>/dev/null || true

echo
echo "Done. Launch with:  firestone"
echo "Steam dual-launch:  /usr/bin/firestone-battlenet  (see LINUX-PORT.md)"
INSTALL
chmod 0755 "$STAGE/install.sh"

cat > "$STAGE/uninstall.sh" <<'UNINSTALL'
#!/usr/bin/env bash
set -euo pipefail
if [ "$(id -u)" -eq 0 ]; then SUDO=""; else SUDO="sudo"; fi
$SUDO rm -rf /opt/firestone
$SUDO rm -f /usr/bin/firestone /usr/bin/firestone-battlenet
$SUDO rm -f /usr/share/applications/firestone.desktop /usr/share/pixmaps/firestone.png
command -v update-desktop-database >/dev/null 2>&1 && \
    $SUDO update-desktop-database -q /usr/share/applications 2>/dev/null || true
echo "Firestone removed."
UNINSTALL
chmod 0755 "$STAGE/uninstall.sh"

cat > "$STAGE/README.txt" <<EOF
Firestone $VERSION — native Linux build (portable tarball)

Install:   ./install.sh      (installs deps, copies to /opt, grants ptrace)
Run:       firestone
Remove:    ./uninstall.sh

Requires an X11 session (not Wayland) and Hearthstone under Wine/Proton in
borderless-windowed mode. See LINUX-PORT.md in the source repo for full details.
EOF

echo ">> building tarball"
mkdir -p "$OUT_DIR"
TARBALL="$OUT_DIR/${NAME}.tar.gz"
tar -C "$REPO/dist/tarball-build" -czf "$TARBALL" "$NAME"

echo
echo "built: $TARBALL"
ls -lh "$TARBALL" | awk '{print "  size:", $5}'
echo "install with: tar xzf ${NAME}.tar.gz && cd $NAME && ./install.sh"
