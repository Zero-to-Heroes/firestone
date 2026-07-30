#!/usr/bin/env bash
#
# Builds both native memory helpers from the vendored .NET sources and stages them
# where the Linux bridges and the electron build expect them.
#
# These are the two out-of-process net8.0 helpers that replace edge-js on Linux:
#   - MindVisionHelper  (unity-spy)    reads Hearthstone's memory via /proc
#   - GameEventsHelper   (hs-converter) parses Power.log into game events
#
# Both are published self-contained, so the target machine needs no system .NET.
# After running this, run tools/linux-probe/setup-debian.sh to (re-)grant the
# ptrace capability, which is cleared whenever the helper binary is rewritten.
#
# Requires the .NET 8 SDK. Point DOTNET at it if it is not at ~/.dotnet/dotnet or
# on PATH.

set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
STAGE="$REPO/libs/electron-edge-libs"

# Resolve the SDK: explicit DOTNET wins, then PATH, then the common per-user install.
if [ -n "${DOTNET:-}" ]; then
    :
elif command -v dotnet >/dev/null 2>&1; then
    DOTNET="$(command -v dotnet)"
elif [ -x "$HOME/.dotnet/dotnet" ]; then
    DOTNET="$HOME/.dotnet/dotnet"
else
    echo "error: .NET 8 SDK not found. Install it or set DOTNET=/path/to/dotnet" >&2
    exit 1
fi
echo "using dotnet: $DOTNET ($("$DOTNET" --version))"

# publish <csproj> <staged-dir-name>
publish() {
    local csproj="$1" name="$2"
    local out dest
    out="$(dirname "$csproj")/publish"
    dest="$STAGE/$name"

    echo ">> publishing $name"
    "$DOTNET" publish "$csproj" \
        -c Release -r linux-x64 --self-contained true \
        -o "$out" --nologo

    rm -rf "$dest"
    mkdir -p "$dest"
    cp -r "$out/." "$dest/"
    echo ">> staged -> $dest"
}

publish "$HERE/unity-spy/MindVisionHelper/MindVisionHelper.csproj"     mindvision-helper
publish "$HERE/hs-converter/GameEventsHelper/GameEventsHelper.csproj"  game-events-helper

echo
echo "done. Both helpers staged into $STAGE/."
echo "Next: 'npx nx build electron-app' to copy them into dist/, then"
echo "      'tools/linux-probe/setup-debian.sh' to grant ptrace on the fresh binary."
