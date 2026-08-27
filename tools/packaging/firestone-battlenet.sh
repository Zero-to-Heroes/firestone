#!/usr/bin/env bash
#
# Launch Firestone (the native Linux overlay) and Battle.net / Hearthstone together.
#
# Intended as the target of a Steam "Add a Non-Steam Game" shortcut, but works as a
# plain launcher from anywhere.
#
#   IMPORTANT: in Steam, leave this shortcut's compatibility/Proton OFF. This is a
#   NATIVE launcher -- it starts the game itself (via Lutris by default). Wrapping it
#   in Proton would try to run the script under Wine, which is not what you want.
#
# Lifetime: the script starts Firestone, launches the game, then blocks until the
# game process disappears and finally stops Firestone. Steam therefore shows the
# shortcut as "running" for the whole session, and closing the game cleans up
# Firestone.
#
# ---- configuration (override via environment, or edit the defaults) ----------
#
#   FIRESTONE_BIN   How to start Firestone.
#                   - .deb install:  firestone            (the default, on PATH)
#                   - dev tree:      /home/you/.local/bin/firestone-overlay.sh
#                                    or an absolute path to the ow-electron launch
#
#   GAME_CMD        Command that starts Battle.net / Hearthstone.
#                   Default: the Lutris "Battle.net" entry (game id 1). List ids with:
#                       lutris -l
#                   Use the PLAIN Battle.net entry, not one that already auto-starts
#                   Firestone in its pre-launch hook, or Firestone would start twice.
#                   Non-Lutris example (Bottles):
#                       GAME_CMD="bottles-cli run -b Battlenet -p 'Battle.net'"
#
#   GAME_PROC       Process name that means "the game is still up". Firestone is
#                   stopped once it is gone. Default: Battle.net.exe (stays up until
#                   you quit the launcher). Set to Hearthstone.exe to tie the session
#                   to Hearthstone instead.

set -uo pipefail

FIRESTONE_BIN="${FIRESTONE_BIN:-firestone}"
GAME_CMD="${GAME_CMD:-lutris lutris:rungameid/1}"
GAME_PROC="${GAME_PROC:-Battle.net.exe}"

log() { printf '[firestone-battlenet] %s\n' "$*"; }

# Match both the .deb (/opt) and dev-tree (dist/) app layouts.
FIRESTONE_MATCH='dist/apps/electron-app|/opt/firestone/apps/electron-app'

firestone_running() { pgrep -f "$FIRESTONE_MATCH" >/dev/null 2>&1; }

stop_firestone() {
    pkill -f "$FIRESTONE_MATCH" 2>/dev/null
    pkill -f "FirestoneMindVisionHelper" 2>/dev/null
    pkill -f "FirestoneGameEventsHelper" 2>/dev/null
    pkill -f "linux-pointer-tracker.py" 2>/dev/null
}

# 1. Start Firestone (detached, single instance). Never block the game on it.
if firestone_running; then
    log "Firestone already running"
else
    log "starting Firestone ($FIRESTONE_BIN)"
    DISPLAY="${DISPLAY:-:0}" setsid "$FIRESTONE_BIN" >/dev/null 2>&1 </dev/null &
fi

# 2. Launch the game.
log "launching game: $GAME_CMD"
# shellcheck disable=SC2086
DISPLAY="${DISPLAY:-:0}" setsid $GAME_CMD >/dev/null 2>&1 </dev/null &

# 3. Wait for the Wine session to appear (up to ~2 min), then block while it lives.
log "waiting for $GAME_PROC ..."
for _ in $(seq 1 60); do
    pgrep -f "$GAME_PROC" >/dev/null 2>&1 && break
    sleep 2
done
if ! pgrep -f "$GAME_PROC" >/dev/null 2>&1; then
    log "warning: $GAME_PROC never appeared; leaving Firestone running and exiting"
    exit 0
fi
log "$GAME_PROC is up; session running"
while pgrep -f "$GAME_PROC" >/dev/null 2>&1; do
    sleep 5
done

# 4. Game closed: stop Firestone.
log "$GAME_PROC exited; stopping Firestone"
stop_firestone
exit 0
