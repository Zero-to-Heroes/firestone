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
   measured; the single worst "Not responding" trigger). **DONE, confirmed in-game**
   (sessions 3-5): phase 1 brought 8.6 s + 4.0 s down to 3.4 s + 0.7 s; phase 2
   (`extractReplayEssentials` — main never parses the XML for BG games) brought it
   to a single 600 ms stall (`xmlFromReplay`, session 5, 9.4 MB replay). Considered
   closed; Plan G is now the top stall source.
2. **Plan F - persistent BGS sim worker** (RSS spikes +150-240 MB per fight, ~once per
   turn; known ~3.5 s/game CPU orchestration cost; low risk, well understood).
   **IMPLEMENTED and confirmed in-game** (session 4): merged with the Plan H worker
   into one persistent compute worker; per-fight RSS oscillation gone, at the cost
   of ~200 MB resident (the worker's cards copy, inside main's OS process).
3. **Plan G - match-start and in-game stalls**: **SCOPED (sessions 6-7, full
   attribution — see the Plan G section)**. The full utilityProcess move is off the
   table; the measured ranking is: (a) `game-state-facade` IPC broadcast fan-out is
   the per-turn cost (517 sends ≥100 ms, 71.5 s total in one game — **Plan D
   handshake IMPLEMENTED and VALIDATED 2026-07-28, session 8: 66 sends / 11.7 s,
   `targets: 2`**; payload diet is now the top open item — session 9 measured
   645 slow sends / 98.4 s late-game as the GameState wire value grows, see the
   Plan G section), (b) match start is API-response `JSON.parse`
   on main (~5.3 s, BG meta-hero stats) plus Electron IPC serialization of those
   payloads (~4.2 s) — **large-payload parse offload IMPLEMENTED and VALIDATED
   2026-07-28, session 9: zero main-thread parses, hero-selection stalls
   12 s → ~3 s** (see the Plan G section), (c) MindVision edge calls are
   confirmed 100% synchronous but moderate in total (~2.9 s/session, mostly at HS
   launch). Parser burst and game-state batches are exonerated (≤665 ms worst).
4. **Plan B (remaining items) - GPU / offscreen overlay + ad/owepm renderers**:
   attribution is done; what is left is the 510-575 MB GPU cost of the offscreen
   overlay, the 173-224 MB ad renderer, and the 153-216 MB hidden owepm window. Mostly
   ow-electron-constrained; investigate what is actionable.
5. **Bug (separate from memory work): empty power.log uploads on Electron** —
   `PowerLogBufferService` is never fed on Electron, but `ReplayUploadService` reads
   it for the power.log upload. Verify and fix (feed the buffer in
   `app.ts`/`GameEvents`, or read the on-disk log at upload time — the latter also
   implements Plan C track 1 for free).
6. **Plan D - IPC fan-out handshake**: **subscription handshake IMPLEMENTED and
   VALIDATED in-game 2026-07-28 (session 8: `game-state-facade` slow sends
   517 → 66, 71.5 s → 11.7 s, every send `targets: 2` — see the Plan D section)**.
   The earlier "fan-out waste was minimal" assessment was wrong: session 7 measured
   `webContents.send('game-state-facade', ...)` structured clones at 100-390 ms
   each, 517 of them ≥100 ms in one game (71.5 s total), the direct cause of the
   0.5-1.0 s per-turn stalls. The payload-diet half (trim the game-state wire
   value per consumer) stays open; remaining per-send cost is two full GameState
   clones (worst 531 ms late-game).
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

**Status: subscription handshake IMPLEMENTED and VALIDATED in-game 2026-07-28
(session 8): `game-state-facade` slow sends 517 → 66, 71.5 s → 11.7 s, every send
`targets: 2` (overlay + BG window only).** `setupElectronSubject` (one fix covers
all ~100 channels) now keeps a per-channel set of subscriber `webContents` instead
of blasting `BrowserWindow.getAllWindows()`:

- A renderer is registered as a subscriber of a channel when it fetches the initial
  value (`ipcRenderer.invoke(eventName)` — every consuming renderer already does
  this in `setupElectronSubject`'s renderer branch) and, belt-and-braces, via an
  explicit `${eventName}-subscribe` fire-and-forget message sent right after the
  listener is installed (covers the case where the invoke fails because main's
  handler isn't up yet). Renderer→main `-update` messages also register the sender.
- Subscribers are removed on their `destroyed` event; no `-unsubscribe` needed
  (windows don't stop consuming a channel while alive).
- `obs.next` on main now skips **both** the `serialize()` and the send entirely
  when a channel has no subscribers, and otherwise sends only to subscribers.
  Windows that never consume a channel (ads `owadview`, `owepm`, settings windows
  for game-state, etc.) no longer pay a structured clone per update.
- The `ipc` slow-op probe now also records `targets` (subscriber count), so the
  next instrumented session shows exactly how many clones each slow send paid.
- Overwolf is untouched (all of this is inside the `isElectronContext` main/renderer
  branches); the hotkey facade's raw `broadcastToRenderers` (tiny, rare payloads)
  is also untouched.

Expected effect (session 7 math): game-state consumers are the overlay + the BG
window, i.e. 2 of the ~5 windows that were being cloned into — roughly halves the
71.5 s/game of `game-state-facade` send time, and eliminates it entirely outside
matches for channels with no live consumers.

Next lever if the post-handshake numbers are still too high: trim the game-state
payload per consumer (overlay + battlegrounds need it; settings/collection/lottery
largely do not). Keep `sanitizeParserStateForElectron`. Use the `ipc` probe data to
rank channels by bytes-per-minute before trimming anything beyond game state.

Done when: a measured BG session shows `game-state-facade` sends going only to the
overlay + BG windows (`targets: 2`), and main's total serialize+send cost drops
accordingly.

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

**Status: IMPLEMENTED (Electron), confirmed in-game (sessions 4-5).** All sims
return through one worker spawned once at startup, zero worker errors across both
sessions. Correction after re-analyzing both sessions' samples: what is gone is the
_structural_ per-fight cost — the cards-DB clone on every fight and the leaked
idle workers. The simulation's own working memory still shows up as transient RSS
churn (+100-400 MB at fight start, reclaimed by the worker's GC within ~15-60 s;
peak main RSS ~1.05-1.15 GB mid-game in both sessions) because worker_threads heaps
live inside main's OS process. That churn is inherent to running the sim in-process
and is transient, not growth; if it ever matters, the lever is sim allocation
behavior (e.g. iteration count, buffer reuse), not worker lifecycle. The designed
trade-off also stands: the one resident cards copy adds ~200 MB to main RSS for the
whole session (238 MB at startup → ~470 MB once the worker is initialized).

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
process. Session 5 (with Plans F+H fully in) confirms the same profile — match
start 3.2 s + 3.7 s, per-turn stalls 0.5-1.3 s from turn 4 on — making this plan
the top remaining stall source now that the end-of-game window is clean.

**Attribution instrumentation ADDED (2026-07-27, awaiting a measured game):** the
memory instrumentation (`FS_ELECTRON_MEM=1`) now installs a `globalThis.__fsSlowOp`
hook; four choke points report timestamped durations through it (JSONL
`kind: "slow-op"` records + `[fs-mem-slow-op]` main-log lines, threshold 100 ms),
so each stall can be attributed to a suspect by timestamp:

- `mindvision` — every edge.js call (`mind-vision-edge.js callPluginMethod`), with
  `syncMs` = how long the invocation blocked before returning vs `ms` = total wall
  time until the .NET callback. Large `ms` with small `syncMs` means the call runs
  async on the CLR and does NOT explain a main-thread stall — this single field
  decides whether "make MindVision non-blocking" is even a thing.
- `parser` — each synchronous `processLogsWithTsParser` batch (line count included).
- `game-state` — each `GameStateService.processQueue` chunk ≥100 ms (event count +
  type sample).
- `ipc` — each facade `next` broadcast (`abstract-facade-service.ts`), split into
  `serializeMs` vs `sendMs` (structured clone inside `webContents.send`).

How to read a session: for each `stall` record, find the `slow-op` records in the
preceding couple of seconds; the category totals over the match-start window and
per-turn windows give the ranking that decides this plan's scope (MindVision
non-blocking vs parser move vs serialize diet).

**Session 6 findings (2026-07-27 22:31, crashed at turn 5 — see the crash note
below; ~10 min of data, still conclusive on the main question):**

- **MindVision is 100% synchronous.** Every single edge.js call had `syncMs == ms`:
  the invocation blocks the main thread for its whole duration, the .NET side never
  runs async from the caller's perspective. `isBootstrapped` blocked 2268 ms
  (matching a 2280 ms stall exactly); `getAchievementsInfo` 191-321 ms x3,
  `getRegion` 235 ms, `getPlayerProfileInfo` 225 ms, `getRewardsTrackInfo` 139 ms,
  `getBattlegroundsInfo` 133 ms. "Make MindVision calls non-blocking" is therefore
  real and the top lever of this plan.
- **Parser burst and game-state batches are small**: the CREATE_GAME batch (611
  lines) parsed in 116 ms; the worst game-state chunk was 192 ms at match start.
  Moving the parser off main looks like poor value on current data.
- **IPC**: one 277 ms broadcast (`ArenaCardStatsService-cardStats`, all of it
  `sendMs` — the structured clone inside `webContents.send`, paid per window).
  Worth a look (why do arena card stats broadcast during a BG session at all?),
  but not a top stall source.
- **Unattributed**: the 2.46 s startup stall (suspected: the prewarm cards-DB clone
  in `ComputeWorkerHost` `postMessage` — now probed as `worker/init-cards-clone`)
  and 2.2 s + 1.8 s around hero selection in a quiet log window (windows/ads/meta
  stats all plausible). Rather than guessing more probes, the instrumentation now
  also records a **session-wide chunked CPU profile** of the main thread
  (`cpu-<session>-NNN.cpuprofile` next to the JSONL, 120 s self-contained chunks so
  a crash loses at most the last chunk); the next measured game attributes every
  stall to a JS stack by timestamp. (Since session 8 the profiler is opt-in via
  `FS_ELECTRON_MEM_CPUPROFILE=1` — its own chunk rotation blocks main ~1 s each
  time, see the session 8 notes.)
- **Per-turn stalls were small this session** (21-185 ms up to turn 5) — consistent
  with earlier sessions' early turns; the 0.5-1.3 s per-turn stalls appeared from
  turn ~5-7 onwards, which this session never reached.

**Crash note (session 6):** the main process died at turn 5 with exception
`0x80000003` (STATUS_BREAKPOINT — a fatal CHECK/assert), faulting module
`electron.exe` itself (ow-electron 39.8.12), no JS error in any log, memory healthy
(main 613 MB). Same symptom as the earlier "game crashed before the end" session.
This is an ow-electron/Chromium-internal failure, not app JS; a WER minidump exists
under `C:\ProgramData\Microsoft\Windows\WER\` if it keeps recurring. Track
separately from the memory work.

**Session 7 (2026-07-28 08:58, full game to turn 15) — SCOPING COMPLETE. Every
stall attributed** (slow-op probes + the chunked CPU profiler, stall windows
extracted from the `.cpuprofile` chunks by timestamp):

1. **Per-turn stalls = `game-state-facade` broadcast fan-out.** 517 broadcasts
   ≥100 ms (100-394 ms each, 71.5 s total over the game); every turn-7+ stall
   (0.5-1.0 s) is a burst of 2-5 consecutive sends. The profile stack is
   unambiguous: `s.send <- broadcastToRenderers <- obs.next` — the structured
   clone inside `webContents.send`, paid once per window per update; `serializeMs`
   (the app-level `serializeForElectron`) is only 5-50 ms of each. Fix =
   original Plan D (only send to windows that subscribed) and/or shrink the wire
   payload / rate-limit; the send count also scales with window count (overlay,
   BG, hidden main, ads, owepm all receive every update today).
2. **Match-start stall (12 s nearly continuous at hero selection, 3.4+4.9+4.0 s) =
   API payloads processed on main.** The stall window contained ~18 s of CPU:
   5.3 s `ElectronApiRunner.parseJsonResponse` (`JSON.parse` of large HTTP
   responses on main — timing matches the BG meta-hero stats fetch used by hero
   selection, `bgs-hero-stats-guardian` fires as the window ends), 4.2 s of
   Electron-internal IPC serialization in microtasks (shipping those payloads to
   renderers via handle replies/broadcasts), 1.1 s GC, ~0.5 s achievements
   `buildCategory`/`buildAchievements`, 0.4 s MindVision `getAchievementsInfo`.
   Fix = fetch+parse big reference payloads off main (compute worker or
   utilityProcess fetch), plus the same IPC diet as (1).
3. **MindVision: confirmed synchronous, moderate total.** `syncMs == ms` on every
   call again; ~2.9 s/session, dominated by `isBootstrapped` (1.1 s, once at HS
   launch). Worth fixing eventually (async edge invocation or re-homing), but
   below (1) and (2).
4. **Exonerated**: parser burst (worst batch 665 ms at CREATE_GAME, one-off) and
   game-state processing (worst chunk 401 ms); startup stall is cards load +
   451 ms measured `init-cards-clone` (accepted, startup-only). The offscreen
   overlay's `getBitmap`/`updateBuffer` paints ~1.2 s per 36 s window on main —
   background load that belongs to Plan B, not a stall spike source.

The utilityProcess pipeline move is therefore NOT needed on current data; Plan G
resolves into two targeted fixes: the game-state-facade broadcast diet (top —
subscription-handshake half implemented 2026-07-28, see Plan D) and moving API
JSON parsing off main (second — implemented 2026-07-28, below).

**Plan G (b) implementation (2026-07-28, awaiting in-game validation):**
`ElectronApiRunner.parseJsonResponse` now ships response text ≥256 KB to the
persistent compute worker (new `parseJson` op), which `JSON.parse`s it and posts
the object back as a structured clone (`resultObject` — NOT re-stringified); main
pays the V8 deserialize instead of the full tokenization. Design choices:

- The **fetch stays on main**: `net.fetch` is async (network I/O never blocked
  main) and keeps Chromium's HTTP cache and proxy behavior — only the CPU-bound
  parse moves. Payloads <256 KB parse inline (a few ms, not worth the roundtrip).
- Covers both `callGetApi` and `callPostApi` (one fix in `parseJsonResponse`);
  wired in `electron-app-injector-setup.ts` via
  `setOffThreadJsonParser` so `libs/electron/common` doesn't depend on the
  app-level `ComputeWorkerHost`. On worker failure or a 15 s timeout it falls
  back to parsing on main — where a new `api/parse-json-main` slow-op probe
  keeps it measured (also measures Overwolf-free fallback sessions).
- Verified by `compute-worker-verify.mjs` (new parseJson roundtrip: structured
  clone equals the main-thread parse; worst main-thread stall 127 ms while the
  worker ran the whole Plan F/H/G suite).
- Expected in-game effect: the ~5.3 s of hero-selection `JSON.parse` drops to
  the (smaller) structured-clone deserialize; the ~4.2 s of Electron IPC
  serialization shipping those payloads to renderers is already reduced by the
  Plan D handshake (only actual consumers receive them). The remaining known
  main-side costs in that window are `DiskCacheService.storeItem`
  (JSON.stringify of the stats on main) and `buildHeroStats` — measure before
  touching either.

**Session 9 (2026-07-28 12:49, full game to turn 17, profiler OFF) — Plan G (b)
VALIDATED; the per-turn freeze problem is solved; the payload diet is the new top
item:**

- **`parse-json-main`: zero occurrences.** No large `JSON.parse` ran on main at
  all; no worker fallbacks/timeouts, no API errors — the offload worked for every
  large payload of the session.
- **Match start (hero selection): ~12 s of stalls → ~3 s** (1.06 s + 1.95 s,
  unattributed — candidates: the structured-clone deserialize of the worker's
  parsed payload on main, `DiskCacheService.storeItem` stringify,
  `buildHeroStats`). Chase with one `FS_ELECTRON_MEM_CPUPROFILE=1` session if
  those 3 s matter enough.
- **Per-turn stalls: solved.** Turns 1-9: worst 16-66 ms (vs 0.5-1.0 s in
  session 7). Even late game the worst per-turn stall was 468 ms (t15), most
  under 250 ms — no more "Not responding" flags. Session 8's remaining 200-900 ms
  per-turn maxima turned out to be partly the CPU profiler's own overhead
  (profiler off this session).
- **End-of-game window: 0.50 s + 0.76 s** — consistent with the known
  `xmlFromReplay` leftover (Plan H).
- **NEW top cost — late-game `game-state-facade` volume**: 645 slow sends
  (all `targets: 2`, max 439 ms; 6.4 s serialize + 91.9 s send), ramping from
  ~turn 12 to 40-60 slow sends/min at 6-10 s of main-thread time per minute —
  10-16% of main spent structured-cloning an ever-growing GameState twice per
  update. Individually small (no stalls), but the aggregate begs for the Plan D
  payload diet: shrink the wire value (eg strip/simplify battle history and sim
  internals from what renderers actually consume) and/or dedupe the update storm
  during fights (sim intermediate results). Sessions 7/8 never showed this
  clearly: session 8 ended at turn 11 right where the ramp starts, and session
  7's numbers were inflated across the whole game by the 5-window fan-out.
- Main RSS peaked at 1.14 GB (in line with previous instrumented sessions).

**Session 8 (2026-07-28 11:04, game to turn 11) — Plan D handshake VALIDATED
in-game:**

- **`game-state-facade` slow sends: 517 → 66, 71.5 s → 11.7 s** of main-thread
  time. Every send reports `targets: 2` (overlay + BG window; one early send hit
  1 while only one window was up) — the ad view, owepm and every non-consuming
  window no longer receive a structured clone per update, exactly as designed.
  No facade errors in the main log; overlays behaved normally in-game.
- **Remaining per-send cost is the payload, not the fan-out**: of the 11.7 s,
  ~9.9 s is the two `webContents.send` clones and ~1.9 s the app-level
  `serializeForElectron`; worst single send 531 ms late-game. The next lever, if
  still needed, is the Plan D payload diet (shrink the GameState wire value).
- **Hero-selection freeze unchanged as expected** (5.3 s + 3.7 s stalls at match
  start): that is Plan G (b), API `JSON.parse` on main — untouched so far.
- **Instrumentation artifact discovered: the chunked CPU profiler's own 120 s
  rotation blocks main 0.5–2.4 s each time** (avg ~1 s, cost grows with session
  length; visible as the every-2-minutes stall train in sessions 7 and 8, drifting
  a few seconds per rotation). This is dev-only overhead of `FS_ELECTRON_MEM=1`
  sessions, but it dominates the per-turn `turn-stall` maxima in both sessions —
  so before/after comparisons must use the `ipc` slow-op totals, not
  `turn-stall`. The profiler is now opt-in (`FS_ELECTRON_MEM_CPUPROFILE=1` on top
  of `FS_ELECTRON_MEM=1`) so ordinary instrumented sessions stay clean; re-enable
  it only when a stall needs stack-level attribution.

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
`CardsPlayedByTurnParser` `parseGame` walk in `buildMetadata`.

**Phase 2 (IMPLEMENTED 2026-07-27, confirmed in-game — see below)** to reach the
~250 ms goal: a full inventory showed that for BG games, everything main reads from
the parsed `Replay` is a fixed set of plain fields — matchup/duration/result,
player/opponent ids, names, hero and hero-power card ids, region/gameType/playCoin,
`additionalResult`, the BG quest/anomaly/trinket fields, and the
`CardsPlayedByTurnParser` output (match analysis only runs for constructed modes and
BG run stats never touch the replay). A new `extractReplayEssentials` worker op
parses the XML off-thread and returns only that summary (`ReplayEssentials`,
`libs/stats/services/.../models/replay-essentials.ts`, field names matching `Replay`
so consumers treat the two uniformly). `EndGameUploaderService.initializeGame` uses
it for BG games when the executor is present and then never calls
`parseHsReplayString`; `game.replayEssentials` is set instead of `game.replay`, and
`ReplayMetadataBuilderService` / `buildGameStat` read whichever exists. Non-BG modes
(replays are ~10x smaller) and the no-worker case (Overwolf) keep the historical
main-thread parse. Verified with `compute-worker-verify.mjs`: worker essentials are
byte-identical to the main-thread reference; on the 8 MB test replay the parse
(1.6 s) + cards walk (0.25 s) moved off main, worst observed main stall 75 ms.

**Phase 2 confirmed in-game (session 5, 2026-07-27 20:53, game to turn 11, 9.4 MB
replay):** the entire end-of-game window produced a **single 600 ms stall** (right
at GAME_END — `xmlFromReplay`, as predicted), versus 3.4 s + 0.7 s in session 4 and
8.6 s + 4.0 s originally. The log shows the new path ran: `extracted replay
essentials in worker true 8712 ms` (wall-clock in the worker, main stayed
responsive; the last battle sim had finished a minute earlier, so no queueing),
then `built metadata after 26743 ms` (also wall-clock — worker compute), upload OK,
`built new game stat` 65 ms after upload, no worker errors. Note the trade-off:
end-to-end upload latency is now ~44 s after GAME_END (worker runs the parses
sequentially at lower priority than before), which only matters if the user quits
the app immediately after a game. Main RSS rose to ~1.04 GB during the worker's
upload-prep work and settled back to ~650 MB two minutes after the game.

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
- Parse 1 initially stayed on main because its `Replay` object (elementtree-backed)
  cannot cross a worker boundary; phase 2 (above) removed it for BG games by having
  the worker return only the plain `ReplayEssentials` summary main actually reads.

Verified with `test-tools/perf/compute-worker-verify.mjs` on `test-tools/bg.log`
(308 k lines, 8 MB XML): worker results are identical to the main-thread path, and
the main thread's worst stall while the worker computes is **~0.1 s versus 7.2 s** of
blocking on the old path (`parseBattlegroundsGame` 3.0 s + `extractStatsForGame`
2.6 s + JSZip 1.6 s).

This is also when the empty-power.log bug (priority 5) is best fixed: if the upload
reads the on-disk Power.log in the worker, both issues close together.

Done when: after GAME_END with instrumentation on, no main-thread stall exceeds
~250 ms attributable to the upload pipeline, and the replay + stats still upload and
appear correctly. **Essentially achieved in session 5**: one 600 ms stall remains,
which is `xmlFromReplay` (builds the XML string from the live game tree on main —
it needs the mutable parser state, so it can't move to the worker as-is). Going
below that is diminishing returns next to Plan G's 0.5-1.3 s per-turn stalls;
consider this plan closed unless future sessions show otherwise.

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
