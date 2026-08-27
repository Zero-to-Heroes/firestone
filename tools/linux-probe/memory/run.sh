#!/usr/bin/env bash
# Proves UnitySpy's memory-reading approach against Hearthstone under Wine.
#   ./run.sh                    # auto-find Hearthstone.exe
#   ./run.sh --pid=12345
#   ./run.sh --process=SomeGame
cd "$(dirname "$0")"
exec node mono-probe.js "$@"
