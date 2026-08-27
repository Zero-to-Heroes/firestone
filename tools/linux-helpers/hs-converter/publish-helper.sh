#!/usr/bin/env bash
# Publishes the net8.0 HearthstoneReplays game-events helper as a self-contained native
# launcher and stages it where the Linux bridge and electron build expect it.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
DOTNET="${DOTNET:-$HOME/.dotnet/dotnet}"
DEST="${1:-$HOME/src/firestone/firestone/libs/electron-edge-libs/game-events-helper}"
"$DOTNET" publish "$HERE/GameEventsHelper/GameEventsHelper.csproj" \
  -c Release -r linux-x64 --self-contained true -o "$HERE/GameEventsHelper/publish" --nologo
rm -rf "$DEST"; mkdir -p "$DEST"
cp -r "$HERE/GameEventsHelper/publish/." "$DEST/"
echo "staged game-events helper -> $DEST"
ls "$DEST/FirestoneGameEventsHelper"
