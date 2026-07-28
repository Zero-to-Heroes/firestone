# Electron Standalone: memory & "Not responding" investigation

This investigation is COMPLETE (July 2026) and its write-up has moved to the
sibling knowledge repo, per workspace conventions:

- `../knowledge/electron-standalone-memory.md` — overview: the reported problem,
  the measured sessions, and the final status of every plan.
- `../knowledge/plan-electron-a-instrumentation.md` — `FS_ELECTRON_MEM=1`
  instrumentation and the unattended fake-game replay drivers.
- `../knowledge/plan-electron-b-renderers-gpu.md` — windows/renderers/GPU
  attribution and the ow-electron upstream questions.
- `../knowledge/plan-electron-c-parser-memory.md` — log buffer & parser history.
- `../knowledge/plan-electron-d-ipc-fanout.md` — IPC subscription handshake +
  GameState payload diet.
- `../knowledge/plan-electron-e-cards-db.md` — cards DB per renderer (closed).
- `../knowledge/plan-electron-f-sim-worker.md` — persistent compute worker + idle
  release.
- `../knowledge/plan-electron-g-main-thread-stalls.md` — stall attribution
  (sessions 6-11), API JSON parse offload, MindVision scoping.
- `../knowledge/plan-electron-h-upload-offload.md` — end-of-game upload offload and
  its Overwolf port.

The full pre-split document (including the running status narrative) is preserved
in this repo's git history for this file.

## Headline results

- End-of-game main-thread stalls: 8.6 s + 4.0 s → a single ~0.3-0.6 s (Plans H +
  the `xmlFromReplay` fast path).
- Per-turn stalls (late BG): 0.5-1.0 s each, 71.5-98 s of send time per game →
  worst ~50 ms typical, 13.6 s total (Plan D handshake + payload diet).
- Match-start stalls: ~12 s → ~3 s (Plan G (b), off-thread API JSON parsing).
- Per-fight RSS spikes (+150-240 MB): eliminated (Plan F persistent worker); the
  idle worker (~130 MB) is now also released when Hearthstone isn't running.
- The last game's parser + game state (~50-70 MB) is released after Hearthstone
  exits.
- Empty power.log uploads on Electron: fixed (worker reads and zips the on-disk
  log).
- Overwolf received the same worker offloads (persistent web worker, upload prep).
