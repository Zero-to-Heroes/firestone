#!/usr/bin/env bash
# Publishes the net8.0 MindVision helper as a self-contained native launcher and stages it
# into the firestone repo where the Linux bridge and the electron build expect it.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
DOTNET="${DOTNET:-$HOME/.dotnet/dotnet}"
DEST="${1:-$HOME/src/firestone/firestone/libs/electron-edge-libs/mindvision-helper}"

"$DOTNET" publish "$HERE/MindVisionHelper/MindVisionHelper.csproj" \
  -c Release -r linux-x64 --self-contained true \
  -o "$HERE/MindVisionHelper/publish" --nologo

rm -rf "$DEST"
mkdir -p "$DEST"
cp -r "$HERE/MindVisionHelper/publish/." "$DEST/"
echo "staged helper -> $DEST"
ls "$DEST/FirestoneMindVisionHelper"
