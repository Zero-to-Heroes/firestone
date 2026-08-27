#!/usr/bin/env bash
# Overlay probe: tests whether a native Linux Electron window can act as a
# Firestone-style overlay over a Wine/Proton-hosted game window.
#
#   ./run.sh                      # auto: Hearthstone -> Battle.net -> HDT
#   ./run.sh --target='^Hearthstone$'
#   ./run.sh --target='Battle'
#
# Hotkeys:  Ctrl+Shift+O  toggle click-through   Ctrl+Shift+Q  quit
cd "$(dirname "$0")"
DISPLAY="${DISPLAY:-:0}" ./node_modules/.bin/electron . "$@" 2>&1 | grep -aE "^\[probe\]|Error"
