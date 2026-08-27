#!/usr/bin/env bash
#
# Firestone-on-Linux prerequisite doctor / installer.
#
# The native Linux build is self-contained except for a handful of RUNTIME
# prerequisites that a fresh Debian-family desktop does not have by default. This
# script detects and (with your consent) fixes them, so moving the build to another
# Debian/Ubuntu/Mint/Pop!_OS machine is one command instead of a scavenger hunt.
#
# It is idempotent: safe to run repeatedly. Run it again after every `nx build` or
# helper re-publish, because copying the helper binary clears its ptrace capability.
#
# What it handles:
#   1. apt packages: x11-utils (xprop/xwininfo), python3 + python3-xlib (pointer
#      tracker), libcap2-bin (setcap).
#   2. CAP_SYS_PTRACE on the MindVision helper, so it can read Hearthstone's memory
#      via /proc/<pid>/mem. Debian ships kernel.yama.ptrace_scope=1, which otherwise
#      permits reading descendants only, and Firestone is not the game's ancestor.
#   3. A sanity check that the app has actually been built.
#
# It never touches the game, the Wine prefix, or Lutris.

set -uo pipefail

# ---- pretty output ----------------------------------------------------------
if [ -t 1 ]; then
    R=$'\e[31m'; G=$'\e[32m'; Y=$'\e[33m'; B=$'\e[1m'; N=$'\e[0m'
else
    R=; G=; Y=; B=; N=
fi
pass() { printf '  %s✓%s %s\n' "$G" "$N" "$1"; }
warn() { printf '  %s!%s %s\n' "$Y" "$N" "$1"; }
fail() { printf '  %s✗%s %s\n' "$R" "$N" "$1"; }
head() { printf '\n%s%s%s\n' "$B" "$1" "$N"; }

FAILED=0

# ---- locate the repo and build artifacts ------------------------------------
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"                       # tools/linux-probe -> repo root
DIST="$REPO/dist/apps/electron-app"
HELPER="$DIST/electron-edge-libs/mindvision-helper/FirestoneMindVisionHelper"
ELECTRON="$REPO/node_modules/@overwolf/ow-electron/dist/electron"
FRONTEND="$REPO/dist/apps/electron-frontend/index.html"

# ---- privilege escalation helper --------------------------------------------
if [ "$(id -u)" -eq 0 ]; then
    SUDO=""
elif command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
else
    SUDO=""
fi
run_priv() {
    if [ -n "$SUDO" ]; then $SUDO "$@"; else "$@"; fi
}

# setcap/getcap live in /usr/sbin, which is not on a normal user's PATH — resolve them
# explicitly so the probe does not report libcap2-bin as missing when it is installed.
find_sbin() {
    command -v "$1" 2>/dev/null || { for d in /usr/sbin /sbin; do [ -x "$d/$1" ] && { echo "$d/$1"; return; }; done; }
}
SETCAP="$(find_sbin setcap)"
GETCAP="$(find_sbin getcap)"

# ---- 1. Debian family check -------------------------------------------------
head "1. Distribution"
if ! command -v apt-get >/dev/null 2>&1; then
    fail "apt-get not found — this script targets Debian-family distros only."
    printf '     On other distros install the equivalents of: x11-utils, python3-xlib, libcap2-bin.\n'
    exit 1
fi
DISTRO="$( . /etc/os-release 2>/dev/null && echo "${PRETTY_NAME:-Debian-family}" )"
pass "apt-based system: $DISTRO"

# ---- 2. apt packages --------------------------------------------------------
head "2. System packages"
# pkg -> a file/command that proves it is installed
MISSING=()
probe_pkg() {  # $1 pkg name, $2 resolved-path-or-empty, $3 human probe name
    if [ -n "$2" ]; then pass "$1 ($3)"; else warn "$1 missing"; MISSING+=("$1"); fi
}
probe_pkg x11-utils   "$(command -v xprop)"   xprop
probe_pkg python3     "$(command -v python3)" python3
probe_pkg libcap2-bin "$SETCAP"               setcap
# python3-xlib provides the Xlib module; there is no command to probe, so import it.
if python3 -c "import Xlib" >/dev/null 2>&1; then
    pass "python3-xlib (Xlib module)"
else
    warn "python3-xlib missing"
    MISSING+=("python3-xlib")
fi

if [ "${#MISSING[@]}" -gt 0 ]; then
    printf '\n  Installing: %s\n' "${MISSING[*]}"
    if run_priv apt-get update -qq && run_priv apt-get install -y "${MISSING[@]}"; then
        pass "installed ${MISSING[*]}"
        # A just-installed libcap2-bin means setcap/getcap now exist — re-resolve.
        SETCAP="$(find_sbin setcap)"; GETCAP="$(find_sbin getcap)"
    else
        fail "apt-get install failed for: ${MISSING[*]}"
        FAILED=1
    fi
fi

# ---- 3. build artifacts -----------------------------------------------------
head "3. Build artifacts"
if [ -x "$ELECTRON" ]; then pass "ow-electron runtime present"; else
    fail "ow-electron missing — run: npm ci"; FAILED=1; fi
if [ -f "$FRONTEND" ]; then pass "frontend built"; else
    fail "frontend missing — run: npx nx build electron-frontend"; FAILED=1; fi
if [ -f "$DIST/main.js" ]; then pass "electron-app built"; else
    fail "electron-app missing — run: npx nx build electron-app"; FAILED=1; fi
if [ -f "$HELPER" ]; then pass "MindVision helper staged"; else
    fail "helper missing — run: ~/src/unity-spy-linux/publish-helper.sh, then nx build electron-app"
    FAILED=1; fi

# ---- 4. ptrace access for memory reading ------------------------------------
head "4. Memory-read permission (ptrace)"
SCOPE="$(cat /proc/sys/kernel/yama/ptrace_scope 2>/dev/null || echo unknown)"
if [ "$SCOPE" = "0" ]; then
    pass "kernel.yama.ptrace_scope=0 — any same-uid process is readable, nothing to do"
elif [ ! -f "$HELPER" ]; then
    warn "helper not built yet; re-run this script after building to grant the capability"
else
    printf '  ptrace_scope=%s restricts /proc/<pid>/mem to descendants.\n' "$SCOPE"
    printf '  Granting CAP_SYS_PTRACE to the helper (least-privilege; no system-wide change).\n'
    if [ -z "$SETCAP" ]; then
        fail "setcap unavailable (install libcap2-bin) — cannot grant the capability"
        FAILED=1
    elif run_priv "$SETCAP" cap_sys_ptrace+ep "$HELPER" 2>/dev/null; then
        if [ -n "$GETCAP" ] && "$GETCAP" "$HELPER" 2>/dev/null | grep -q cap_sys_ptrace; then
            pass "cap_sys_ptrace set on the helper"
            warn "copying the binary clears this — re-run after each 'nx build' / helper re-publish"
        else
            fail "setcap reported success but the capability is not present"
            printf '     Likely a nosuid mount. Fallback: %ssysctl -w kernel.yama.ptrace_scope=0%s\n' "$B" "$N"
            FAILED=1
        fi
    else
        fail "setcap failed"
        printf '     Fallback (rebuild-proof, but system-wide): \n'
        printf '       echo 0 | %ssudo tee /proc/sys/kernel/yama/ptrace_scope%s\n' "$B" "$N"
        printf '       persist in /etc/sysctl.d/10-ptrace.conf: kernel.yama.ptrace_scope = 0\n'
        FAILED=1
    fi
fi

# ---- summary ----------------------------------------------------------------
head "Summary"
if [ "$FAILED" -eq 0 ]; then
    printf '  %s%sAll prerequisites satisfied.%s Launch with Lutris, or:\n' "$G" "$B" "$N"
    printf '    cd %s\n' "$REPO"
    printf '    DISPLAY=:0 node_modules/@overwolf/ow-electron/dist/electron dist/apps/electron-app --no-sandbox\n'
    exit 0
else
    printf '  %s%sSome checks failed — see above.%s\n' "$R" "$B" "$N"
    exit 1
fi
