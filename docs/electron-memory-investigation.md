# Electron Standalone: memory & "Not responding" investigation (handoff)

Status as of 2026-07-27: **Plan A (instrumentation) is DONE — implemented and two real
BG sessions measured** (see the two "measured session" sections below). Every renderer
process is attributed and baseline stall numbers exist. The plans have been
reprioritized from the data — see "Current priorities" at the top of the Mitigation
plans section. The single biggest measured stall source is a NEW finding not in the
original plans: the end-of-game upload pipeline blocks main for ~13 s (now Plan H,
priority 1). Plans B-H are not started.

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
`apps/electron-app/src/app/services/electron-app-injector-setup.ts`):

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
- **`TagsHistory` is read on the live path**: `getTagWithHistory` falls back to
  `entity.TagsHistory.filter(t => t.Name === tag).pop()` in
  `libs/game-state/src/lib/services/parser-entity-utils.ts` (`getEntityTag` itself only
  reads current tags) - so history cannot simply be truncated; a latest-value-per-tag
  map must replace it.
- **Renderers cannot share a V8 heap** - routing the cards DB through IPC from main
  does not remove per-renderer copies, it only changes the source.
- Each window's Angular entry point (`electron-entry-point.component.ts`) independently
  runs `initializeCardsDb()`, so every renderer holds a full cards DB.
- `webContents.getOSProcessId()` maps windows to Task Manager pids exactly;
  `app.getAppMetrics()` (not currently used in the repo) gives the whole per-process
  breakdown from inside the app.

---

## First measured session (2026-07-27, real BG game, turns 0-11, HS crashed before end)

Free build, dev frontend (localhost:4200), 25 min, `memory-2026-07-27-13-02-28.jsonl`
(100 samples at 15s). Headline numbers:

| Process                                | Steady state    | Peak                                |
| -------------------------------------- | --------------- | ----------------------------------- |
| main (Browser)                         | ~470-520 MB RSS | **949 MB** (spikes, see finding 2)  |
| renderer `#/overlay`                   | -               | 442 MB                              |
| renderer `#/battlegrounds`             | -               | 418 MB                              |
| 3x renderer **unattributed**           | -               | 401 / 393 / 292 MB (~1.09 GB total) |
| renderer `owepm://index.html` (hidden) | -               | 177 MB                              |
| GPU                                    | -               | **608 MB**                          |
| **Total working set**                  |                 | **~3.75 GB across 9 processes**     |

Findings, ranked:

1. **Attribution gap (biggest unknown)**: only 3 `BrowserWindow`s existed (overlay,
   battlegrounds, hidden owepm loading window) but 6 renderer processes were alive; the
   3 unattributed ones total ~1.09 GB. Suspects: ow-electron overlay infrastructure /
   `<owadview>` ad renderers / devtools. The sampler now also records
   `allWebContents` (`webContents.getAllWebContents()`: type, URL, pid) to attribute
   them next session. Feeds Plan B.
2. **Main-process spikes, not steady growth**: main heapUsed grew only ~170->250 MB
   over 11 turns (parser state: 1538 entities, 31.4k Tags, 70.3k TagsHistory). But RSS
   spiked to 830-950 MB roughly once per turn, correlated with `external` jumping by
   150-240 MB — consistent with the per-fight BGS sim worker structured-cloning the
   whole cards service. Supports Plan F.
3. **Stalls**: in-game longest stall per turn trends up with turn number, reaching a
   consistent ~380-430 ms by turns 7-11. Startup produced 1.2-2.0 s stalls; the worst
   stall (2.3 s) happened as Hearthstone was dying, right before MindVision
   `ReadProcessMemory` failures — memory reads against a dying process block main
   (relevant to Plan G scope).
4. **GPU at 608 MB** — 3x the originally reported 201 MB (Plan B item 4).
5. **PowerLogBufferService is EMPTY on Electron**: `pushLine` is only called from
   `libs/legacy/feature-shell/.../log-register.service.ts` (Overwolf path);
   `apps/electron-app/src/app/app.ts` wires `LogListenerService` straight to
   `gameEvents.receiveLogLine`, bypassing it. Consequences: (a) the doc's original
   "buffer doubles peak RSS" hypothesis does NOT apply to Electron — de-prioritize
   Plan C track 1; (b) **probable bug**: `ReplayUploadService.uploadGame` reads
   `powerLogBuffer.getCurrentGameLog()` for the power.log upload, which would upload an
   empty power.log on Electron. To be verified separately.

## Second measured session (2026-07-27, full BG game, turns 0-13, game completed)

`memory-2026-07-27-14-00-57.jsonl`, 40 min, with the `allWebContents` attribution added
after session 1. **The attribution gap is closed** — every renderer is now accounted
for:

| Process (peak sample)                 | Memory     | Attribution                                      |
| ------------------------------------- | ---------- | ------------------------------------------------ |
| main (Browser)                        | 876 MB     | spikes with `external` per fight (Plan F)        |
| GPU                                   | 574 MB     | overlay is **offscreen-rendered** (see below)    |
| 2x "unknown" renderers from session 1 | ~400 MB ea | **detached DevTools** — dev mode only            |
| `#/overlay` renderer                  | 398 MB     | `wc:offscreen` — ow-electron offscreen surface   |
| `#/battlegrounds` renderer            | 352 MB     | visible window                                   |
| ad renderer                           | 173-224 MB | `wc:owadview` (overwolf adview.html, free build) |
| `owepm://index.html` (hidden)         | 153-216 MB | ow-electron package manager window               |

Notes:

- The two ~400-430 MB mystery renderers from session 1 are **detached DevTools**
  (`electron-window-handler.service.ts` / `overlay.service.ts` call
  `openDevTools({ mode: 'detach' })` in dev mode for every window). They do not exist
  in production; production-equivalent total is ~2.6 GB, not ~3.4 GB.
- The overlay's webContents reports type `offscreen`: ow-electron overlays render
  offscreen and composite in the GPU process — this is why GPU sits at 510-575 MB
  (Plan B item 4 confirmed as a real, user-visible cost).
- **Worst stalls are the end-of-game upload pipeline, on the main thread**: at
  GAME_END, building the metadata (`built metadata after 3973 ms` in the log), an
  8.4 MB replay XML, JSZip compression and stat recompute produced back-to-back stalls
  of **8.6 s and 4.0 s** — this alone shows "Not responding". Match start produced
  4.3-5.5 s stalls (around MindVision battlegroundsInfo reads). In-game per-turn
  longest stalls grow steadily: ~400 ms by turn 4, ~0.6-1.0 s by turns 7-13.
- Main-process pattern from session 1 confirmed: heapUsed grows modestly (140->330 MB
  over 13 turns; 2778 entities / 119k TagsHistory), while RSS spikes (to 876 MB) track
  `external` buffer jumps per fight — the BGS sim worker clone (Plan F).

Plan A is DONE: ranked attribution table and baseline stall numbers exist. The
resulting priorities are listed at the top of the next section.

## Mitigation plans

### Current priorities (post-measurement, 2026-07-27)

Ranked by measured impact per unit of risk. The original A-G lettering is kept for
continuity; H is new.

1. **Plan H - end-of-game upload pipeline off the main thread** (stalls: 8.6 s + 4.0 s
   measured; the single worst "Not responding" trigger). **IMPLEMENTED and
   confirmed in-game** (sessions 3-4): 8.6 s + 4.0 s → 3.4 s + 0.7 s even on a 50%
   bigger game; what remains is parse 1 on main, see the Plan H section for the
   possible phase 2.
2. **Plan F - persistent BGS sim worker** (RSS spikes +150-240 MB per fight, ~once per
   turn; known ~3.5 s/game CPU orchestration cost; low risk, well understood).
   **IMPLEMENTED and confirmed in-game** (session 4): merged with the Plan H worker
   into one persistent compute worker; per-fight RSS oscillation gone, at the cost
   of ~200 MB resident (the worker's cards copy, inside main's OS process).
3. **Plan G (reduced scope first) - match-start and in-game stalls**: match start
   blocks 4.3-5.5 s (around MindVision battlegroundsInfo reads), per-turn stalls grow
   to 0.6-1.0 s by turns 7-13. Profile what exactly blocks (MindVision edge.js calls
   vs parser burst vs serialize+send) before committing to the full utilityProcess
   move.
4. **Plan B (remaining items) - GPU / offscreen overlay + ad/owepm renderers**:
   attribution is done; what is left is the 510-575 MB GPU cost of the offscreen
   overlay, the 173-224 MB ad renderer, and the 153-216 MB hidden owepm window. Mostly
   ow-electron-constrained; investigate what is actionable.
5. **Bug (separate from memory work): empty power.log uploads on Electron** —
   `PowerLogBufferService` is never fed on Electron, but `ReplayUploadService` reads
   it for the power.log upload. Verify and fix (feed the buffer in
   `app.ts`/`GameEvents`, or read the on-disk log at upload time — the latter also
   implements Plan C track 1 for free).
6. **Plan D - IPC fan-out handshake**: still correct, but demoted — in the measured
   sessions only overlay + battlegrounds windows were open (both genuinely need game
   state), so fan-out waste was minimal. Becomes relevant when collection/settings/
   lottery windows are open during a game.
7. **Plan C track 2 - TagsHistory cap**: demoted — main heapUsed grew only 140->330 MB
   over 13 turns (119k TagsHistory entries); real but small compared to the above.
   Track 1 as originally written is moot (the buffer is empty on Electron; see the bug
   above).
8. **Plan E - cards DB per renderer**: demoted — only 2-3 app renderers actually run
   in a normal session (fewer-windows lever already reality), and the big renderers
   (overlay/battlegrounds) legitimately need cards. Revisit if renderer heaps become
   the top block after 1-4.
9. **Overwolf port of the worker offloads (Plans H + F)**: gated on the Electron
   implementation proving itself over several real sessions — see "Subsequent phase
    - port the worker offloads to Overwolf" at the end of the Plan H section.

Dev-only note: dev builds auto-open detached DevTools for every window
(~400-430 MB each, ~840 MB in session 2). Not a user-facing cost, but remember to
exclude them when comparing numbers against user reports.

### Plan A - Instrumentation (DONE 2026-07-27, incl. data collection)

Implemented, env-gated
(`FS_ELECTRON_MEM=1`), in
`apps/electron-app/src/app/services/memory-instrumentation.service.ts` (started from
`App.initGameDetection` right after `buildAppInjector()`, stopped in `App.onWillQuit`):

- `app.getAppMetrics()` sampled on an interval (pid, type, serviceName,
  workingSetSize/peakWorkingSetSize in KB, CPU%). Default every 15s, overridable via
  `FS_ELECTRON_MEM_INTERVAL` (seconds).
- Per live window: id, title, `webContents.getURL()`, `webContents.getOSProcessId()`,
  `isVisible()`, `isMinimized()` - so every renderer row is attributed exactly.
- `process.memoryUsage()` split (`rss` / `heapTotal` / `heapUsed` / `external` /
  `arrayBuffers`) to separate V8 heap from external buffers.
- Cheap size probes: PowerLogBuffer line count + total chars (new O(1)
  `PowerLogBufferService.getStats()`), `CurrentEntities.size`, summed Tags/TagsHistory
  lengths, current turn, cards count, window count.
- Main-thread stall detector: 250ms `setInterval` recording timer drift; logs the
  longest stall per turn (on `TURN_START`) and any single stall >500ms immediately -
  measures "Not responding" directly.

#### Plan A - how to run

1. Set `FS_ELECTRON_MEM=1` (optionally `FS_ELECTRON_MEM_INTERVAL=<seconds>`) and start
   the Electron build.
2. Play a real BG game, or run `fakeGame('bg.log', { isBg: true })` from devtools with
   the 1.03M-line `bg.log` (see `../knowledge/parser-performance.md`).
3. Samples land in `userData/logs/memory-YYYY-MM-DD-HH-MM-SS.jsonl`, one JSON object
   per line: `kind: 'meta' | 'sample' | 'stall' | 'turn-stall'`. Stall events are also
   mirrored as `[fs-mem-stall]` lines in `userData/logs/main-*.log` so they can be
   time-correlated with the rest of the app's activity.

Offline size estimates: `test-tools/perf/electron-parser-state-serialize-perf.mjs` now
also reports per-turn cumulative raw log chars (PowerLogBuffer heap proxy) and the
`v8.serialize` size of the TagsHistory arrays alone (what Plan C track 2 would
reclaim).

Done when: a ranked attribution table for late-BG exists, plus a baseline
longest-stall number. **DONE 2026-07-27** — see the two measured-session sections
above. Keep the instrumentation in place: it is the before/after harness for every
other plan.

### Plan B - Window and renderer inventory

Status: items 1-3 are effectively DONE via the session-2 attribution (no leaked
windows; the "extra" renderers were dev-only DevTools, the ad view and the owepm
window). Remaining work is items 4-5 (GPU / offscreen overlay cost, consolidation
decision) plus deciding whether anything can be done about the ad and owepm renderers
within ow-electron's constraints.

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

Status: track 1 as written is MOOT on Electron — the buffer is never fed there (see
session-1 finding 5); the real issue is the empty power.log upload bug (priority 5
above), and fixing it by reading the on-disk log at upload time would implement track
1's idea as a side effect. Track 2 is demoted (small measured heap growth).

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

**Status: IMPLEMENTED (Electron), confirmed in-game (session 4, 2026-07-27 17:58,
long game to turn 17).** 17 sims returned through one worker spawned once at
startup, zero worker errors, and the per-fight RSS oscillation is gone — main RSS
between turn samples is now smooth (520 → 700 MB over the game, tracking parser
growth) where session 2 swung by +150-420 MB per fight. The trade-off is visible
and as designed: worker_threads live inside the main OS process, so the one
resident cards copy adds ~200 MB to main RSS for the whole session (238 MB at
startup → ~470 MB once the worker is initialized and a match starts).

Implementation: instead of a second persistent worker (which would have kept a
second resident cards copy), the
sim was merged with the Plan H upload-prep worker into a single persistent
`compute-worker.thread.ts`, managed by `ComputeWorkerHost`
(`apps/electron-app/src/app/services/compute-worker-host.ts`): one worker, one
resident cards copy, cloned once per app run (prewarmed at startup in `app.ts` right
after the cards load). `BgsBattleSimulationWorkerService` streams intermediate
results through the host; the worker survives across fights and is respawned on
crash/exit. This also fixes a leak in the old per-fight design: workers were only
terminated when the result carried `outcomeSamples`, so sims without samples left
idle workers behind. Requests are processed sequentially by the single worker (a
battle sim and an upload zip queue behind each other) — accepted trade-off, they
rarely overlap. Verified by the sim smoke test in
`test-tools/perf/compute-worker-verify.mjs` (streams intermediates, plausible final
result). The Overwolf web worker keeps its per-fight behavior for now (see the
Overwolf port phase below).

Done when: sims still return odds mid-BG; cards cloned once per session, not per
fight (verify in-game: no more +150-240 MB RSS spikes on main per fight). **Both
verified in session 4.**

### Plan G - Move parsing off the main thread (escalation path)

Plans B-F shave footprint; none structurally fix "Not responding" because the parser
and game-state pipeline still run on the thread that owns the windows. Option: move the
pipeline into an Electron `utilityProcess` (or `worker_threads`), keeping main as a
thin window/IPC owner. Hard part: the DI graph in `electron-app-injector-setup.ts`
assumes co-residency with main; MindVision and the facade IPC would need re-homing. A
smaller intermediate step: move only the parser behind a message boundary (largest
single CPU block).

Measured stall numbers (2026-07-27) that scope this plan: match start blocks main
4.3-5.5 s; per-turn longest stalls grow from ~400 ms (turn 4) to 0.6-1.0 s (turns
7-13); a 2.3 s stall occurred while MindVision read memory from a dying Hearthstone
process. Before committing to the full move, profile WHICH of these is MindVision
(edge.js runs on the main thread) vs parser burst vs game-state serialize+send — the
answer may shrink this plan to "make MindVision calls non-blocking" plus Plan H.

### Plan H - End-of-game upload pipeline off the main thread (NEW, priority 1)

The single worst measured "Not responding" trigger (session 2): at GAME_END the main
thread blocked **8.6 s, then 4.0 s** while the pipeline ran end-to-end on main:

- `[manastorm-bridge]` builds the full replay XML (8.4 MB string this game) and
  metadata — `built metadata after 3973 ms` in the log (includes match analysis /
  `compArchetype`);
- JSZip compresses the replay (and would compress power.log) — CPU on main;
- after upload, `built new game stat` + `RecomputeGameStatsEvent` produced the second
  (4.0 s) stall.

**Status: IMPLEMENTED (first phase), confirmed in-game (session 3, 2026-07-27
17:12).** A real BG game (4.2 MB replay, about half the size of session 2's) went
from 8.6 s + 4.0 s of end-of-game stalls to a **single 971 ms stall**. The
`[upload-prep]` worker spawned cleanly, replay + metadata + game stat all uploaded
and processed correctly (`built new game stat` now fires 42 ms after upload instead
of after a multi-second parse). The remaining ~1 s is parse 1 (`parseHsReplayString`
in `initializeGame`, ~0.7 s, still on main by design) plus the one-time
cards-DB clone to the worker, which landed inside the window because the worker
spawned lazily on first use. Both follow-ups are now done: the worker is prewarmed
at app startup right after the cards load (`app.ts`), and the worker was merged with
the BGS sim worker (Plan F) into a single persistent `compute-worker.thread.ts`.
Note `built metadata after 6794 ms` is wall-clock (worker compute + one-time init),
not main-thread blocking.

**Session 4 (2026-07-27 17:58, long game, 12.7 MB replay — 50% bigger than the
original problem session):** prewarm confirmed (`[compute-worker] spawning worker`
at startup, nothing cloned at game end); end-of-game stalls were **3.4 s + 0.7 s**
(vs an extrapolated ~19 s on the old path for this size). Both remaining stalls are
the known main-side leftovers and scale with replay size: the 3.4 s is parse 1
(`parseHsReplayString` of 12.7 MB in `initializeGame`), the 0.7 s is the
`CardsPlayedByTurnParser` `parseGame` walk in `buildMetadata`. **Possible phase 2**
to reach the ~250 ms goal: extract everything main reads from the parsed `Replay`
(matchup, duration, player/opponent ids and names, `additionalResult`,
cards-played-by-turn, the fields `buildGameStat` uses) in the worker as plain data,
so main never parses the XML at all.

Code exploration showed the same ~8 MB XML string was fully parsed up to **four
times** on main for one game: (1) `parseHsReplayString` in
`EndGameUploaderService.initializeGame`, (2) `parseBattlegroundsGame` inside
`ReplayMetadataBuilderService.buildBgsMetadata` (the bulk of `built metadata after
3973 ms`), (3) `parseHsReplayString` again in `buildGameStat` on `REVIEW_FINALIZED`
(the bulk of the second, 4.0 s stall), and (4) `extractStatsForGame`
(`GlobalStatsService`, also on `REVIEW_FINALIZED`). Plus three JSZip DEFLATE-9
compressions (replay / power.log / metadata) on main.

What was implemented:

- **Redundant parse removed**: `buildGameStat` now reuses the already-parsed
  `game.replay` instead of re-parsing the XML (parse 3 gone, no thread needed).
- **New `UploadPrepExecutorService`** (abstract, `@firestone/stats/services`):
  off-thread executor for `parseBattlegroundsGame`, `extractStatsForGame`, and
  single-file DEFLATE zips. Only Electron provides an implementation
  (`apps/electron-app/src/app/services/upload-prep-worker.service.ts`, backed by the
  persistent `compute-worker.thread.ts` shared with the BGS sim, esbuild-bundled via
  `build-worker.js`; cards DB cloned to the worker once per app run). Consumers
  (`ReplayMetadataBuilderService`, `GlobalStatsService`, `ReplayUploadService`) fall
  back to their historical main-thread path when the service is absent (Overwolf) or
  the worker fails, so parses 2 and 4 and all three zips leave main on Electron.
- Parse 1 stays on main by design: its `Replay` object (elementtree-backed) feeds
  many main-side consumers and cannot cross a worker boundary.

Verified with `test-tools/perf/compute-worker-verify.mjs` on `test-tools/bg.log`
(308 k lines, 8 MB XML): worker results are identical to the main-thread path, and
the main thread's worst stall while the worker computes is **~0.1 s versus 7.2 s** of
blocking on the old path (`parseBattlegroundsGame` 3.0 s + `extractStatsForGame`
2.6 s + JSZip 1.6 s).

This is also when the empty-power.log bug (priority 5) is best fixed: if the upload
reads the on-disk Power.log in the worker, both issues close together.

Done when: after GAME_END with instrumentation on, no main-thread stall exceeds
~250 ms attributable to the upload pipeline, and the replay + stats still upload and
appear correctly. Remaining known main-thread costs in the window: `xmlFromReplay`
(~0.6 s), parse 1 (~1-2 s), and `CardsPlayedByTurnParser`/match-analysis walks —
re-measure a real game to see if they alone still cross the threshold.

### Subsequent phase - port the worker offloads to Overwolf

The Overwolf build runs the same pipeline in its background renderer, so it pays the
same multi-second CPU costs (jank inside the app windows rather than an OS-level
"Not responding", but still worth fixing). The offloads port cleanly because
everything moved to the worker is pure JS (no Node APIs at the worker level —
`worker_threads` usage lives only in the Electron host):

- Implement `UploadPrepExecutorService` with a **Web Worker** (same Angular
  webworker bundling as the existing per-fight
  `libs/battlegrounds/simulator/src/lib/workers/bgs-battle-sim-worker.worker.ts`),
  reusing the compute-worker message protocol; provide it in the Overwolf app
  module. Consumers already resolve it optionally, so no consumer changes needed.
- Make the Overwolf sim web worker persistent with init-once cards, mirroring
  `ComputeWorkerHost` (or share one web worker for both, like on Electron).
- `buildGameStat`'s redundant-parse removal already benefits Overwolf (shipped with
  Plan H).

Do this once the Electron implementation has proven itself in real games (results
upload correctly across several sessions, no worker-related errors in the logs).

---

## Open questions

- ~~Was the reported session the free (ad-supported) build, and were collection /
  settings / lottery windows open?~~ ANSWERED for the dev sessions: free build, no
  extra app windows — the additional renderers were dev-only DevTools plus the ad
  view and the owepm window. The original user report (6 renderers, ~616 MB) remains
  plausible as: overlay + battlegrounds + loading/owepm + ad view + possibly
  collection/settings.
- What exactly blocks main at match start (4.3-5.5 s) — MindVision edge.js calls,
  parser catch-up on existing log lines, or something else? (Scopes Plan G.)
- Can the ad (`owadview`) and owepm renderers be trimmed at all within ow-electron?
  (Plan B remaining scope.)

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
