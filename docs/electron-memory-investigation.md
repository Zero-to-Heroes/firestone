# Electron Standalone: memory & "Not responding" investigation (handoff)

Status as of 2026-07-26: **investigation and planning complete, nothing implemented yet.**
This document is the source of truth to resume the work from any machine. The next
concrete step is Plan A (instrumentation); the plans are ordered by expected leverage.

Per workspace conventions, the durable knowledge write-up should eventually be split
into dedicated files in the sibling `../knowledge/` repo (see "Pending follow-up" at the
bottom); until then, this file carries everything.

---

## The reported problem

During a Battlegrounds game, Task Manager shows many `Firestone Standalone.exe`
processes and ~1.7GB of RAM. Measured baseline from the reported session (screenshot,
Task Manager Details):

| Process              | Type                          | Memory                                                          |
| -------------------- | ----------------------------- | --------------------------------------------------------------- |
| main (no `--type`)   | Node main, **Not responding** | ~895 MB                                                         |
| 6x `--type=renderer` | one per BrowserWindow         | ~616 MB combined (74.5 / 141.3 / 17.8 / 97.7 / 204.7 / 79.7 MB) |
| `--type=gpu-process` | Chromium GPU                  | ~201 MB                                                         |
| `--type=utility`     | NetworkService                | ~15 MB                                                          |
| **Total**            |                               | **~1.73 GB**                                                    |

These are **two separate problems** with two separate metrics:

1. **Footprint** (bytes of RSS, per process).
2. **Main-thread stalls** (milliseconds of blockage). "Not responding" is a liveness
   symptom: main owns the window HWNDs, so when it blocks, Windows flags the app.

## Assessment

### Process model (expected, not a leak by itself)

Electron always runs main + GPU + utility processes plus one renderer per
`BrowserWindow` / ow-electron `OverlayBrowserWindow`, all under the same exe name.
Window creation sites:

- `apps/electron-app/src/app/services/overlay.service.ts` - `#/overlay` (in-game HUD)
- `apps/electron-app/src/app/services/electron-window-handler.service.ts` -
  `#/battlegrounds`, `#/collection`, `#/settings`, `#/lottery`, `#/loading`

Six renderers matches exactly the six window types; the free build's `<owadview>` ad
tag (`apps/electron-frontend/src/app/ads/ow-electron-ads.ts`, used by
`electron-loading.component.ts`) can spawn more, as can detached DevTools.

### Why main is ~895MB and Not responding

Unlike Overwolf (parser shares a renderer with overlays), Electron runs the whole
pipeline in the Node main process (wired in `apps/electron-app/src/app/app.ts` and
`electron-app-injector-setup.ts`):

1. **Power-log parser state** - unbounded per match: every entity, `TagsHistory`,
   `Game.Data` tree. Late-BG sample: ~4.5k entities, ~333k TagsHistory entries, raw
   parserState ~15MB serialized (see `../knowledge/parser-performance.md`).
2. **`PowerLogBufferService`** - every line of the current game as `string[]`
   (`libs/shared/common/service/src/lib/services/logs/power-log-buffer.service.ts`);
   `getCurrentGameLog()` additionally joins it all into one giant string at upload,
   roughly doubling peak RSS.
3. **Live `GameState` + BG state** (`otherZone` ~600 cards late-game, board history,
   face-offs) plus rewind snapshots.
4. **Full cards DB** (`AllCardsService`) on main.
5. **BGS battle-sim workers** - a fresh `worker_threads` Worker per fight, each
   receiving a structured clone of the entire cards service
   (`apps/electron-app/src/app/services/bgs-battle-simulation-worker.service.ts`).

CPU side: late BG turns emit 20-30x more log lines (~95k lines on turn 37), and every
~500ms `GameStateFacadeService` serializes game state and fans it out over IPC.

### Verified facts that constrain the fixes

- **IPC broadcast is app-wide**: `setupElectronSubject` has ~100 call sites across ~85
  facade services. `AbstractFacadeService.broadcastToRenderers`
  (`libs/shared/framework/core/src/lib/services/abstract-facade-service.ts`) sends every
  `next` of every subject to `BrowserWindow.getAllWindows()`. Each window pays a
  structured clone per emission and retains a hydrated copy per subject it touches -
  part of why some renderer rows are 100-200MB.
- **Hidden-but-alive windows are a legitimate state, not automatically leaks.** No
  `close` handler calls `preventDefault()` (closed windows are destroyed), and there is
  no `.hide()` call in `apps/electron-app` - but windows are created `show: false` and
  the toggle logic explicitly handles "exists but hidden"
  (`toggleCollectionWindow`, `isWindowUserDismissed`). Inventory must classify by
  `isVisible()` / `isMinimized()`.
- **`TagsHistory` is read on the live path**: `getEntityTag` falls back to
  `entity.TagsHistory.filter(t => t.Name === tag).pop()` in
  `libs/game-state/src/lib/services/parser-entity-utils.ts` - so history cannot simply
  be truncated; a latest-value-per-tag map must replace it.
- **Renderers cannot share a V8 heap** - routing the cards DB through IPC from main
  does not remove per-renderer copies, it only changes the source.
- Each window's Angular entry point (`electron-entry-point.component.ts`) independently
  runs `initializeCardsDb()`, so every renderer holds a full cards DB.
- `webContents.getOSProcessId()` maps windows to Task Manager pids exactly;
  `app.getAppMetrics()` (not currently used in the repo) gives the whole per-process
  breakdown from inside the app.

---

## Mitigation plans (ordered by leverage; A gates the rest)

### Plan A - Instrumentation (do first, gates everything else)

Every other plan's expected win is currently a guess. Build, env-gated
(`FS_ELECTRON_MEM=1`) in main:

- `app.getAppMetrics()` sampled on an interval (pid, type, serviceName, memory).
- Per live window: id, title, `webContents.getURL()`, `webContents.getOSProcessId()`,
  `isVisible()`, `isMinimized()` - so every renderer row is attributed exactly.
- `process.memoryUsage()` split (`rss` / `heapTotal` / `heapUsed` / `external` /
  `arrayBuffers`) to separate V8 heap from external buffers.
- Cheap size probes: PowerLogBuffer line count + total chars, `CurrentEntities.size`,
  summed Tags/TagsHistory lengths, cards count, window count.
- Main-thread stall detector: 250ms `setInterval` recording timer drift, log the
  longest stall per turn - measures "Not responding" directly.

Repro harness: `fakeGame()` + the 1.03M-line `bg.log` (see
`../knowledge/parser-performance.md`), run in the Electron build with sampling on.
Offline size estimates: extend `test-tools/perf/electron-parser-state-serialize-perf.mjs`.

Done when: a ranked attribution table for late-BG exists, plus a baseline
longest-stall number.

### Plan B - Window and renderer inventory

~616MB of renderers + ~201MB GPU is the largest block after main and the least
understood.

1. Identify all six renderers by URL/pid/visibility (Plan A logging). Suspects: the six
   window routes, `<owadview>` ad renderers, detached DevTools, leaked overlays.
2. Classify each as visible / hidden / leaked. Cross-check the zombie-overlay behaviour
   (`overlay.service.ts` `isOverlayWindowUnhealthy` / `destroyOverlay`,
   `../knowledge/bug-bg-overlay-zombie-after-disconnect.md`).
3. Close what should not be alive; decide policy for hidden windows (destroy on hide vs
   accept - each hidden window pays a full renderer, a cards DB and every broadcast).
   Check the loading window after startup in particular.
4. Investigate the ~201MB GPU process: full-screen transparent always-on-top overlay
   backing stores; can the surface be dropped when nothing is displayed?
5. Evaluate consolidating overlay + battlegrounds panel into one renderer; record the
   decision either way (trades RAM against isolation and the transparent-window
   minimize quirk, `../knowledge/bug-electron-bg-minimize.md`).

Done when: every renderer in a BG session is accounted for by an intentionally-open
window, and leaked/unnecessary ones are gone.

### Plan C - Log buffer and parser history

Track 1 - **PowerLogBuffer off the heap**: replace the in-memory `string[]` with
offsets into the on-disk Power.log (already tailed by `log-listener.service.ts`),
reading and streaming the slice at upload time instead of `join('\n')`. Preserve
`confirmNewGame` / `confirmReconnect` / `clearAfterUpload` semantics (including the
reconnect case). Note: `listenOnFileUpdate` also reads the whole existing log into
memory at monitor start - a separate transient spike.

Track 2 - **cap parser history**: keep a latest-value-per-tag map; retain full
`TagsHistory` only when rewind needs it, behind an explicit "lite history" flag. The
rewind non-reg goldens must stay green in full mode
(`test-tools/non-reg/rewind-nonreg.spec.ts`).

Done when: late-BG main RSS no longer tracks log size, upload no longer doubles peak
RSS, rewind goldens pass.

### Plan D - Narrow the IPC fan-out

Add an explicit subscription handshake in `AbstractFacadeService` (one fix covers all
~100 channels): `${eventName}-subscribe` / `-unsubscribe` channels, per-window
subscriber tracking (cleaned up on window destroy), send only to subscribers, and skip
`serialize()` entirely when there are none. Then trim the game-state payload per
consumer (overlay + battlegrounds need it; settings/collection/lottery largely do
not). Keep `sanitizeParserStateForElectron`. Use Plan A data to rank channels by
bytes-per-minute before trimming anything beyond game state.

Done when: with collection and settings open during BG, neither receives a full
`GameState` clone, and main's serialize+send cost drops measurably.

### Plan E - Cards DB footprint per renderer

What actually helps, in order: (1) fewer windows (Plan B - dominant lever), (2) lazy
and scoped `initializeCardsDb()` - windows that never resolve a card (loading, most of
settings) should not pay for it, (3) a trimmed in-memory card model projecting only the
fields the UI reads (also shrinks the main-process copy). Note: per-window duplication
is not only cards - facade subject copies (Plan D) are separate; quote wins as
cards-only.

Done when: opening settings alone does not load a second full cards DB; overlay and BG
still resolve card names and images.

### Plan F - Persistent BGS sim worker

CPU-and-spike fix more than steady-state RAM. Keep one long-lived worker: init cards
once, post only `BgsBattleInfo` per fight, recreate + re-init on crash/exit, terminate
on quit. Same pattern applies to the web worker in
`libs/battlegrounds/simulator/src/lib/workers/bgs-battle-simulation-worker.service.ts`.
Respect the packaged-worker bundling constraint
(`../knowledge/bug-electron-bgs-simulator-worker.md` - the thread worker is
esbuild-bundled by `apps/electron-app/build-worker.js` because deps are not in the
asar).

Done when: sims still return odds mid-BG; cards cloned once per session, not per fight.

### Plan G - Move parsing off the main thread (escalation path)

Plans B-F shave footprint; none structurally fix "Not responding" because the parser
and game-state pipeline still run on the thread that owns the windows. Option: move the
pipeline into an Electron `utilityProcess` (or `worker_threads`), keeping main as a
thin window/IPC owner. Hard part: the DI graph in `electron-app-injector-setup.ts`
assumes co-residency with main; MindVision and the facade IPC would need re-homing. A
smaller intermediate step: move only the parser behind a message boundary (largest
single CPU block). Decide after Plan A's stall numbers.

---

## Open questions

- Was the reported session the free (ad-supported) build, and were collection /
  settings / lottery windows open? Determines whether six renderers was expected.
  Plan A answers this definitively either way.

## Pending follow-up (original plan, not yet executed)

Split this document into dedicated files in `../knowledge/`:
`electron-standalone-memory.md` (overview) plus one `plan-electron-*.md` per plan
above, and add "Related" links from `../knowledge/parser-performance.md`.

## Related repo assets

- `test-tools/perf/parse-log-perf.mjs`, `full-pipeline-perf.spec.ts`,
  `electron-parser-state-serialize-perf.mjs`, `live-bench.mjs`,
  `analyze-cpuprofile.mjs` - measurement harnesses (see
  `../knowledge/parser-performance.md` for usage and past results).
- `test-tools/power.log` - current repro/test log.
- `../knowledge/parser-performance.md` - parser/pipeline perf history and the
  verification checklist for perf changes.
