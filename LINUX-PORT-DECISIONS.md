# Linux Port — Design Decisions & Caveats

Companion to [`LINUX-PORT.md`](LINUX-PORT.md). That file documents **what** the
Linux port does; this one records **why** it was done that way — the non-obvious
choices, the alternatives that were rejected, and the traps that cost real time.

**If you are an AI agent or a new contributor about to change Linux-port code:
read the relevant entry here first.** Several of these decisions look wrong at a
glance and were reverted-to on purpose. Each entry is: the decision, why, what was
rejected, and any caveat.

---

## 1. Only the overlay was rewritten — memory reading ports as-is

**Decision.** Replace the `@overwolf/ow-electron` overlay; keep the UnitySpy
memory-reading approach.

**Why.** "Injection doesn't work under Wine" conflated two unrelated mechanisms.
The Overwolf overlay genuinely injects (hooks D3D/DXGI in the game's swapchain) —
Windows-specific, does not work under Wine. UnitySpy never injects: it does
`OpenProcess` + `ReadProcessMemory` from *outside*, which maps cleanly onto
`/proc/<pid>/{maps,mem}`. Confirmed against the shipped binary — `UnitySpy.dll`
has `ReadProcessMemory`/`EnumProcessModulesEx` but no `CreateRemoteThread`,
`LoadLibrary`, or `WriteProcessMemory`.

**Caveat.** Do not try to "fix" the Overwolf overlay under Wine; it is a dead end.
The X11 window is the replacement, on purpose.

---

## 2. Out-of-process .NET helpers instead of edge-js

**Decision.** Run the two .NET pieces (memory reader, log parser) as separate
`net8.0` processes speaking newline-delimited JSON-RPC over stdio.

**Why.** `electron-edge-js` cannot host the .NET 8 runtime on Linux. Rather than
downgrade or rewrite the .NET in JS, the helpers run out-of-process. stdout is the
protocol channel, stderr is logs — keep them strictly separate or the JSON parser
chokes.

**Rejected.** In-process via edge-js (impossible); rewriting UnitySpy/HSReplays in
TypeScript (huge, error-prone).

---

## 3. Self-contained .NET publish

**Decision.** Publish helpers with `-r linux-x64 --self-contained true`.

**Why.** Two reasons: (1) the target machine then needs no system .NET; (2) the
`apphost` is a real ELF, and **only a real ELF can carry a Linux capability**
(`CAP_SYS_PTRACE`, see §4). A framework-dependent publish produces a launcher that
can't be `setcap`'d meaningfully.

---

## 4. ptrace via `setcap` on the helper, not a system-wide sysctl

**Decision.** Grant `cap_sys_ptrace+ep` to the MindVision helper binary.

**Why.** Debian defaults to `kernel.yama.ptrace_scope=1`, which only lets a
process read the memory of its *descendants*. Firestone is not the game's
ancestor, so it cannot read Hearthstone's memory without help. `setcap` on just
the helper is least-privilege; the alternative, `sysctl kernel.yama.ptrace_scope=0`,
weakens the whole system.

**Caveat (important, easy to miss).** **A file's capabilities are cleared whenever
it is copied.** Every `nx build` / helper re-publish / package install rewrites the
binary and drops the cap. That is why the setup script, the `.deb` postinst, and
the tarball installer all re-apply it, and why you must re-run
`setup-debian.sh` after a dev rebuild. If memory reads suddenly fail after a build,
this is almost always why. Fallback when `setcap` is unavailable (e.g. a `nosuid`
mount): the sysctl above.

---

## 5. Overlay input model (the click-through window)

A transparent, always-on-top, click-through X11 window receives **no** pointer
events at all. Three sub-decisions follow from that.

### 5.1 Cursor position comes from `XQueryPointer`, not Electron

**Why.** `screen.getCursorScreenPoint()` returns the last position the *app* saw in
an event. A click-through window never gets events, so after the first
passthrough toggle the value **freezes** and the overlay never notices the cursor
again. `linux-pointer-tracker.py` asks the X server directly (`XQueryPointer`) and
streams position + button mask (bit 8 = Button1). It emits only on change.

### 5.2 Hit-testing requires actually-painted content

**Why.** Several widgets reserve space with large transparent boxes that still
carry `pointer-events: all` (e.g. a ~1581×240 `bgs-board-widget-wrapper` strip laid
right over the tavern minions). Claiming the cursor there makes the game
unclickable. So the overlay only takes the cursor over a pixel that is actually
drawn (a background, image, media element, or text), checking a few ancestors, and
rejects any element covering >⅓ of the viewport.

### 5.3 The 20 Hz loop is gated on movement

**Why.** The loop injected a synthetic `mouseMove` + ran a `getComputedStyle`
layout flush every tick whenever the cursor was inside the (full-screen) overlay —
i.e. always. The synthetic move woke Angular change-detection across the whole
overlay tree 20×/s at idle, which is what made the app feel sluggish. Gating on
"cursor/button actually changed since last processed tick" drops idle cost to ~zero
without affecting responsiveness (the tracker only emits on change, so a resting
cursor leaves the gate closed).

---

## 6. Battlegrounds simulator: parallel warm pool with atomic cancellation

This one was iterated several times; the final shape exists because the simpler
shapes were tried and failed. **Do not "simplify" it back.**

**Where it runs.** On Linux the game-event pipeline — and the sim — runs in the
**main process** (not a renderer), so a single worker_thread leaves every other
core idle. That is why parallelism matters so much here.

**Progression of attempts:**

1. *Single worker (original).* 8000 sims on one thread → result lands a round late.
2. *N fresh workers per battle.* Faster, but respawning workers and
   re-deserializing the whole card database on every combat is a large fixed cost,
   and it streams jittery merged partials.
3. *Warm pool + terminate-to-preempt.* Workers reused and cards cached — but a
   worker mid-simulation can't be interrupted, and worker_threads process messages
   serially, so a new board's job **queued behind** the stale one. Killing the busy
   worker to preempt then **reloaded the card DB on respawn** — during a fast
   multi-stage board reveal this thrashed reloads and a 6-reveal burst took ~7.7s.
   This also produced the "old score from the previous battle stays up at the
   tavern" bug: when a battle's sim never completed, its faceOff had no result and
   the overlay fell back to the last battle that did.
4. *Warm pool + cancel-don't-kill (final).* A shared atomic run-id
   (`SharedArrayBuffer`) is bumped per run; each worker checks it **between
   simulation steps** and abandons a superseded run mid-flight, then picks up the
   newer job from its queue. No worker dies → cached cards survive → no reload, and
   stale work is dropped within one step.

**Other choices:**

- **Worker count = `cpus().length - 1`, computed at runtime.** Explicitly *not*
  hardcoded (was requested). One core is left free for the main process, overlay,
  and game.
- **Outcome samples recorded on one worker only.** Only one sample set is kept, so
  the other workers skip the expensive replay recording.
- **Cancellation granularity** is one `battleIterator.next()` step. In streaming
  mode (`intermediateResults` set) the sim yields frequently, so a stale run is
  dropped quickly. A non-streaming single run may not check until it finishes — an
  accepted trade-off, since the in-game path always streams.

**Caveat.** This changes the worker↔main message contract: messages are
`{ runId, data, done }`, `cards` is sent only on a worker's first job, and the
`SharedArrayBuffer` is passed via `workerData`. If you touch either file, keep both
ends in sync.

---

## 7. Packaging is hand-rolled (dpkg-deb / tar), not electron-builder

**Decision.** Assemble the payload directly with `dpkg-deb` and `tar`.

**Why.** The repo's `electron-builder.yml` targets Windows only and its
`afterPack` hook (`build-tools/electron-afterpack.js`) **deletes non-Windows
binaries**; the Overwolf builder also wants network access to Overwolf's servers.
The Linux runtime is simple enough to assemble by hand: the app bundle needs
exactly one native node module (`better-sqlite3` + its deps); everything else is
webpacked into `main.js`, and `electron-edge-js` is never referenced in the Linux
bundle.

**Caveat (build trap).** `nx build` can refresh the helper's `apphost` launcher in
`dist/` but leave the **old `FirestoneMindVisionHelper.dll`** next to it. The app
then serves stale responses while a hand-run helper looks correct. If results are
stale after a change, `md5sum` the `.dll` in `libs/` vs `dist/` and re-sync.

---

## 8. Frontend loaded over `file://`

**Decision.** `constants.ts:rendererUrl()` returns a `file://` URL to the built
frontend when there is no dev server.

**Why.** Under the `/opt` install layout `app.isPackaged` is **false**, so the
naive "packaged ⇒ file, else dev-server" check fails and the overlay renders blank
(`ERR_CONNECTION_REFUSED`). The helper resolves the built `index.html` on disk and
only falls back to `http://localhost:<port>` when a dev server is actually running.

---

## 9. Steam dual-launcher runs natively (Proton OFF)

**Decision.** `firestone-battlenet.sh` is a native launcher; the Steam shortcut
must have compatibility/Proton **disabled**.

**Why.** Firestone is a native Linux process — it must not run under Wine. The
script starts Firestone, launches the game (via Lutris by default), and blocks on
the game process so Steam tracks the session and Firestone is stopped on exit. The
default `GAME_CMD` targets the *plain* Battle.net Lutris entry, not one whose own
pre-launch hook already starts Firestone, to avoid starting it twice.

---

## 10. Portability: tarball now, AppImage/Flatpak deliberately not

**Decision.** Ship a `.deb` (Debian) and a portable tarball (everything else).

**Why the others were rejected (for now):**

- **AppImage.** Attractive (one file, no root), but the app still spawns `python3`
  for the pointer tracker and shells out to `xprop`/`xwininfo`, and it needs
  `CAP_SYS_PTRACE` — **an AppImage cannot grant a capability to itself**, so ptrace
  would fall back to the system-wide sysctl. Feasible later, not built.
- **Flatpak.** The sandbox blocks the port's core mechanisms: reading another
  process's `/proc/<pid>/mem`, `CAP_SYS_PTRACE`, raw X11, and spawning helper
  processes. Making it work needs holes that defeat the sandbox. Poor fit.

**Caveat.** `python-xlib` is the one non-obvious runtime dependency. It exists only
for the pointer tracker and could be removed across all distros by replacing that
script with a tiny compiled `XQueryPointer` probe — a good future cleanup.

---

## 11. Verification status (be honest about this)

Only the **`.deb` path on Debian 13 (X11/KWin)** has been run end-to-end against
Hearthstone under Proton. The portable tarball is built and its installer is
validated, but **installation on Fedora / Arch / openSUSE is not yet verified**,
and Wayland is unsupported. Do not describe non-Debian install as "working" until
someone confirms it on the actual distro.

---

## 12. Known-harmless noise (don't chase these)

- `OwLegacyPremiumService`, `MainWindowStateFacadeService`,
  `HotkeyFacadeService` handler errors on the electron path — upstream stubs, no
  functional impact on the Linux build.
- Intermittent `GPU process isn't usable. Goodbye.` on launch; recovers on
  relaunch. A `--disable-gpu` wrapper fallback is an option if it becomes chronic.
