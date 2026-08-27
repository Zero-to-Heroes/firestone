# Firestone on Linux (Debian family & beyond)

This document describes what was **ported and rewritten** so Firestone — normally
a Windows/Overwolf app — runs natively on Linux against Hearthstone hosted by
Wine/Proton, overlay and all. It is the reference for the `linux-native-port`
branch.

For the low-level feasibility probes and every trap hit while porting, see
[`tools/linux-probe/README.md`](tools/linux-probe/README.md). For **why** the port
was built the way it was — the non-obvious decisions, rejected alternatives, and
caveats — see [`LINUX-PORT-DECISIONS.md`](LINUX-PORT-DECISIONS.md).

Verified on: Debian 13, X11 (KDE Plasma / KWin), Hearthstone under Proton via
Lutris + umu in a Battle.net prefix.

---

## 1. The core insight: two different "injections"

The port was thought to be blocked because "injection doesn't work under Wine".
That conflated **two unrelated mechanisms** Firestone uses, only one of which
actually injects:

| Mechanism | What it does | Under Wine |
| --- | --- | --- |
| `@overwolf/ow-electron` overlay | Injects into the game, hooks D3D/DXGI, renders Chromium inside the game's swapchain | **Does not work** — Windows-specific hooking. Replaced with an ordinary X11 window. |
| `UnitySpy` memory reading | `OpenProcess` + `ReadProcessMemory` from *outside* the game; never injects | **Works** — ports to `/proc/<pid>/{maps,mem}`. |

So the memory-reading half ports cleanly; only the overlay half had to be
re-implemented with a different technology.

---

## 2. Architecture of the Linux build

### 2.1 Out-of-process .NET helpers (replacing edge-js)

On Windows, Firestone hosts the .NET memory/log code in-process via
`electron-edge-js`. On Linux, edge-js **cannot host the .NET 8 runtime**, so the
two pieces of .NET run as **separate `net8.0` processes** that speak
newline-delimited JSON-RPC over stdio (stdout = protocol, stderr = logs):

| Helper | Replaces | Job |
| --- | --- | --- |
| `FirestoneMindVisionHelper` (unity-spy) | UnitySpy.dll in-process | Reads Hearthstone memory via `/proc/<pid>/{maps,mem}` and parses the Mono/Unity heap |
| `FirestoneGameEventsHelper` (hs-converter) | HearthstoneReplays in-process | Parses `Power.log` into game events |

Each helper is published **self-contained** (`-r linux-x64 --self-contained`), so
the target machine needs no system .NET. The `apphost` is a real ELF, which
matters because it can carry a Linux capability (ptrace — see §5).

The JS bridges that spawn and talk to the helpers are selected by platform at
runtime:

```ts
// mind-vision-electron.service.ts / game-events-electron.service.ts
const bridgeFile = process.platform === 'win32'
    ? 'mind-vision-edge.js'          // Windows: edge-js in-process
    : 'mind-vision-edge-linux.js';   // Linux: spawn the out-of-process helper
```

### 2.2 The overlay: an X11 window instead of swapchain injection

`@overwolf/ow-electron`'s in-game overlay is replaced by an ordinary
**transparent, always-on-top, click-through `BrowserWindow`** positioned over the
Wine-hosted game window. Everything specific to that lives in
`linux-overlay.service.ts` and `linux-game-detection.service.ts`.

Because a click-through X11 window receives **no** pointer events, two problems
had to be solved that don't exist on the Overwolf overlay:

- **Cursor tracking** — `screen.getCursorScreenPoint()` returns the last position
  the *app* saw in an event, which freezes on a click-through window. Replaced by
  `linux-pointer-tracker.py`, which streams the true cursor position + button
  state from the X server via `XQueryPointer` (python-xlib).
- **Selective click-through (hit-testing)** — the overlay decides per-cursor-tick
  whether the pixel under the cursor is real widget content (toggle passthrough
  off so the widget is interactive) or empty space (stay click-through so the
  click reaches the game). It DOM-hit-tests the point and only claims the cursor
  over actually-painted content.

### 2.3 Frontend loading without a dev server

`constants.ts:rendererUrl()` loads the built Angular frontend over `file://` when
there is no dev server (`isPackaged`, or the `/opt` install layout), falling back
to `http://localhost:<port>` only when a dev server is actually running.

---

## 3. What changed, file by file

### Added — Linux runtime (in `apps/`, `libs/`)

| File | Purpose |
| --- | --- |
| `apps/electron-app/.../services/linux-overlay.service.ts` | The X11 overlay: transparent click-through window, cursor hit-testing, passthrough toggling, pointer-tracker integration |
| `apps/electron-app/.../services/linux-game-detection.service.ts` | Finds the Wine-hosted game via `/proc` + X11 EWMH (`xprop`/`xwininfo`) and tracks its window geometry |
| `apps/electron-app/src/assets/linux-pointer-tracker.py` | Streams true cursor position + button mask from the X server (`XQueryPointer`) |
| `libs/electron-edge-libs/mind-vision-edge-linux.js` | JS bridge: spawns `FirestoneMindVisionHelper`, JSON-RPC over stdio |
| `libs/electron-edge-libs/game-events-edge-linux.js` | JS bridge: spawns `FirestoneGameEventsHelper` |
| `apps/electron-app/.../services/bgs-battle-simulation-worker.service.ts` | Battlegrounds combat simulator executor — parallel warm worker pool (see §4) |
| `apps/electron-app/.../services/bgs-battle-sim-worker.thread.ts` | The worker_thread that runs the actual simulation |

### Changed — cross-platform seams

| File | Change |
| --- | --- |
| `apps/electron-app/src/app/app.ts` | Wire the Linux overlay + game-detection services; platform-guarded startup |
| `apps/electron-app/src/app/constants.ts` | `rendererUrl()` — `file://` frontend when no dev server |
| `apps/electron-app/.../mind-vision-electron.service.ts` | Select the Linux bridge on non-Windows |
| `apps/electron-app/.../game-events-electron.service.ts` | Select the Linux bridge on non-Windows |
| `apps/electron-app/src/app/api/main.preload.ts` | Expose the extra IPC the overlay needs |
| `libs/.../electron-game-window.service.ts` | Linux game-window plumbing |
| `libs/shared/framework/core/.../overwolf.service.ts` | Route Overwolf file APIs (`storeAppFile`/`readAppFile`/`deleteAppFile`) through the electron fs-backed IPC bridge when `overwolf.extensions.io` is unavailable |
| `libs/shared/common/service/.../log-utils.service.ts`, `logs/log-listener.service.ts` | Read `Power.log` from the Wine-prefix path on Linux |
| `libs/.../global-stats.service.ts` | Minor Linux-safe path handling |

### Added — vendored .NET helper sources (`tools/linux-helpers/`)

The two helpers were previously in external repos; their sources are now
**in-tree** so a fresh clone can rebuild everything:

- `tools/linux-helpers/unity-spy/` — MindVisionHelper (memory reader)
- `tools/linux-helpers/hs-converter/` — GameEventsHelper (log parser)
- `tools/linux-helpers/build.sh` — publishes both self-contained and stages them
  into `libs/electron-edge-libs/{mindvision-helper,game-events-helper}/`

### Added — tooling & packaging (`tools/`)

- `tools/linux-probe/` — feasibility probes, the deep README, the setup doctor
- `tools/linux-probe/setup-debian.sh` — idempotent prerequisite installer (§5)
- `tools/packaging/build-deb.sh` — builds the Debian `.deb`
- `tools/packaging/build-tarball.sh` — builds the portable, any-distro tarball
- `tools/packaging/firestone-battlenet.sh` — Steam / dual launcher (§7)

---

## 4. Battlegrounds simulator (Linux performance work)

On Linux the whole game-event pipeline — and therefore the BGS combat
simulation — runs in the **main process**. The simulator is embarrassingly
parallel (independent Monte-Carlo runs whose tallies add up), so
`bgs-battle-simulation-worker.service.ts` was rewritten from a single worker into
a **persistent warm pool**:

- **One worker per core** (`cpus().length - 1`), sims split across them, tallies
  merged — near-linear speedup vs a single thread.
- **Warm pool** — workers are spawned once and reused; the large card database is
  shipped to each worker only on its first job and **cached** there, so there is
  no per-combat card reload.
- **Cancel, don't kill** — the opponent board is revealed in stages during one
  combat, each stage starting a fresh run on a more accurate board. A shared
  atomic run-id (`SharedArrayBuffer`) is bumped per run; workers check it between
  simulation steps and **abandon** a superseded run mid-flight, then pick up the
  new one from their queue. No worker is killed, so cached cards survive and stale
  work is dropped within one step.
- **Outcome samples on one worker only** — only one sample set is kept, so the
  other workers skip the expensive replay recording.

Result: rapid board-reveal bursts land the latest board's odds well before the
round ends, and every combat reliably produces its own result.

### Overlay input cost

`linux-overlay.service.ts` runs a 20 Hz cursor hit-test loop. It is gated on
actual cursor movement + button-state change, so a resting cursor over the
full-screen overlay costs ~nothing instead of injecting a synthetic mouse-move
and forcing a layout flush 20×/second.

---

## 5. Runtime prerequisites

Handled automatically by the installers; listed here for reference.

- **X11 utilities** — `xprop` / `xwininfo` (locate and track the game window).
- **python3 + python-xlib** — the pointer tracker.
- **setcap** (from libcap) — to grant the ptrace capability below.
- **ptrace:** reading Hearthstone's memory needs `CAP_SYS_PTRACE` on the
  MindVision helper (`setcap cap_sys_ptrace+ep`) **or** a system-wide
  `kernel.yama.ptrace_scope=0`. Debian defaults to `1`, which only permits
  reading descendants, and Firestone is not the game's ancestor. `setcap` is the
  least-privilege choice.
  - **`setcap` is cleared whenever the binary is copied**, so it is re-applied by
    the package postinst / installer, and must be re-run after every dev
    `nx build` / helper re-publish.
- **Display:** X11 only (no Wayland); game in borderless-windowed (not exclusive
  fullscreen).

Package names per distro (installed automatically — see §6):

| Distro family | X11 utils | python-xlib | setcap |
| --- | --- | --- | --- |
| Debian / Ubuntu / Mint / Pop!_OS (apt) | `x11-utils` | `python3-xlib` | `libcap2-bin` |
| Fedora / RHEL (dnf) | `xorg-x11-utils` | `python3-xlib` | `libcap` |
| Arch / Manjaro (pacman) | `xorg-xprop` | `python-xlib` | `libcap` |
| openSUSE (zypper) | `xprop` | `python3-python-xlib` | `libcap-progs` |

---

## 6. Installation

Two prebuilt formats, both produced from a completed build (§7). Both install the
runtime prerequisites for you and grant the ptrace capability.

> **Verification status:** so far only the **`.deb` path on Debian 13** has been
> installed and run end-to-end. The portable tarball is built and its installer is
> validated, but installation on non-Debian distros (Fedora, Arch, openSUSE, …) is
> **not yet verified** — treat §6.2 as untested until confirmed on those systems.

### 6.1 Debian / Ubuntu / Mint / Pop!_OS — `.deb`

```bash
tools/packaging/build-deb.sh                                 # -> dist/executables/firestone_<version>_amd64.deb
sudo apt install ./dist/executables/firestone_<version>_amd64.deb
firestone
```

`Depends:` pulls `x11-utils`, `python3-xlib`, `libcap2-bin`; the postinst runs
`setcap`. Uninstall with `sudo apt remove firestone`.

### 6.2 Any other distro — portable tarball

Works on any glibc distro (Fedora, Arch, openSUSE, …). The bundled `install.sh`
detects the package manager, installs the prerequisites, copies the app to
`/opt/firestone`, and grants ptrace.

```bash
tools/packaging/build-tarball.sh                             # -> dist/executables/firestone-<version>-linux-x64.tar.gz
tar xzf dist/executables/firestone-<version>-linux-x64.tar.gz
cd firestone-<version>-linux-x64
./install.sh            # installs deps + copies to /opt + setcap (uses sudo)
firestone
```

Uninstall with `./uninstall.sh` from the extracted folder. See §8 for what to do
if your distro is not one of the four recognised package managers.

### 6.3 From source (developers)

```bash
cd firestone
tools/linux-helpers/build.sh        # only if the .NET helpers are not staged / changed
npx nx build electron-frontend
npx nx build electron-app
tools/linux-probe/setup-debian.sh   # deps + ptrace cap — RE-RUN after each build
DISPLAY=:0 node_modules/@overwolf/ow-electron/dist/electron dist/apps/electron-app --no-sandbox
```

Debug the live overlay DOM by adding `--remote-debugging-port=9223` and driving it
over CDP. Verbose overlay input tracing: `FIRESTONE_DEBUG_OVERLAY_INPUT=1`.

> **Trap:** `nx build` can refresh the helper's `apphost` launcher but leave the
> old `FirestoneMindVisionHelper.dll` in `dist/`. If responses look stale,
> `md5sum` the `.dll` in `libs/` vs `dist/` and re-sync.

Packaging is hand-rolled with `dpkg-deb` / `tar` rather than `electron-builder`:
the repo's `electron-builder.yml` is Windows-only and its `afterPack` hook deletes
non-Windows binaries. The only native runtime dependency is `better-sqlite3`
(`electron-edge-js` is never referenced in the Linux bundle).

---

## 7. Launching alongside the game (Lutris & Steam)

Firestone is a **native** process — it does not run under Wine/Proton. It reads
the game's memory through `/proc` and draws its own X11 overlay, so it just needs
to be running while Hearthstone is up. It self-detects the game and idles when the
game is absent, so starting it early is harmless.

### 7.1 Lutris

Wire it into the Lutris entry that launches Hearthstone: point the entry's
**pre-launch** command at a script that starts Firestone, and the **post-exit**
command at one that stops it. On a machine using the `.deb`, the pre-launch
command can simply be `/usr/bin/firestone`.

### 7.2 Steam — one shortcut that starts both

`tools/packaging/firestone-battlenet.sh` starts Firestone **and** the game
together, then stops Firestone when the game closes. Use it as a Steam non-Steam
shortcut:

1. Steam → **Games ▸ Add a Non-Steam Game to My Library ▸ Browse**, and pick
   `firestone-battlenet.sh` (the tarball installs it as `/usr/bin/firestone-battlenet`).
2. Open the shortcut's **Properties**. **Leave compatibility / Proton OFF** — this
   is a native launcher; it starts the game itself. (If Steam only lists `.exe`
   files, set the file-type filter to *All Files*.)
3. Launch it. It starts Firestone, then the game, and Steam shows it running until
   you quit the game.

Configure it via environment variables in the shortcut's **Launch Options** (or by
editing the script). Defaults target the Lutris "Battle.net" entry:

| Variable | Default | Meaning |
| --- | --- | --- |
| `FIRESTONE_BIN` | `firestone` | How to start Firestone (`.deb` puts it on PATH; for a dev tree, point to your launch script) |
| `GAME_CMD` | `lutris lutris:rungameid/1` | Command that starts Battle.net / Hearthstone. List Lutris ids with `lutris -l`. Non-Lutris example: `bottles-cli run -b Battlenet -p 'Battle.net'` |
| `GAME_PROC` | `Battle.net.exe` | Process whose presence means "still playing"; Firestone stops once it exits. Set to `Hearthstone.exe` to tie the session to Hearthstone |

> Use the **plain** Battle.net launch entry, not one whose own hooks already start
> Firestone, or Firestone would start twice.

---

## 8. Portability beyond Debian

**The app itself is already distro-neutral.** It bundles Electron, the two
self-contained .NET helpers, and a prebuilt `better-sqlite3`; nothing links
against distro-specific libraries beyond a baseline glibc + X11. What is *not*
portable is only the packaging and the handful of runtime prerequisites.

Options considered, and why the tarball is the current recommendation:

| Format | Portable? | Verdict |
| --- | --- | --- |
| **`.deb`** (`build-deb.sh`) | Debian family only | Best experience there; auto-deps + setcap via postinst. |
| **Portable tarball** (`build-tarball.sh`) | Any glibc distro | **Recommended for everything else.** Bundled `install.sh` covers apt / dnf / pacman / zypper deps and setcap; falls back to a printed dep list on anything exotic. |
| **AppImage** | Any glibc distro, no install | Attractive (single file, no root). *But* the app must still spawn `python3` for the pointer tracker and shell out to `xprop`/`xwininfo`, and needs `CAP_SYS_PTRACE` — an AppImage cannot grant a capability to itself, so ptrace would fall back to `ptrace_scope=0`. Feasible as a future artifact; not built yet. |
| **Flatpak** | Any distro, sandboxed | **Poor fit.** The sandbox blocks the very things the port relies on: reading another process's `/proc/<pid>/mem`, `CAP_SYS_PTRACE`, raw X11 access, and spawning helper processes. Would need broad `--device`/`--talk`/`ptrace` holes that defeat the sandbox. |
| **Native `.rpm` / `.pkg.tar.zst`** | Per-distro | Straightforward to add later (same `/opt` payload as the `.deb`); the tarball covers these users today without maintaining N packaging recipes. |

Practical notes for a non-Debian target:

- **Dependencies** — the tarball's `install.sh` already knows the package names in
  §5 for apt / dnf / pacman / zypper. On an unrecognised manager it prints the
  three things to install and continues; install them, then re-run `install.sh`.
- **ptrace** — `setcap`/`CAP_SYS_PTRACE` is a kernel feature, identical on every
  distro. If `setcap` is unavailable or the filesystem is `nosuid`, the fallback
  is `sudo sysctl -w kernel.yama.ptrace_scope=0` (persist in
  `/etc/sysctl.d/10-ptrace.conf`).
- **python-xlib** — the one non-obvious dependency. It could later be removed
  entirely by replacing the pointer tracker with a tiny compiled `XQueryPointer`
  probe, which would drop the runtime Python requirement across all distros.
- **glibc floor** — Electron and the .NET self-contained runtime set the minimum
  glibc. Very old LTS distros may be below it; current releases are fine.

---

## 9. Known limitations / deferred

- Intermittent `GPU process isn't usable. Goodbye.` on launch; recovers on
  relaunch. A `--disable-gpu` fallback in the wrapper is an option if it recurs.
- Firestone does not yet write `log.config` itself on Linux (uses the Wine-prefix
  path); currently relies on it already existing.
- Harmless upstream stubs on this path: `OwLegacyPremiumService`,
  `MainWindowStateFacadeService`, `HotkeyFacadeService` handlers.
- Wayland is not supported (X11 only).
- AppImage / native `.rpm` / `.pkg` are feasible but not yet built (§8).

---

## 10. Contributing / PR conventions

Upstream conventions this branch follows (see `CONTRIBUTING.md` and `.github/`):

- **Commit messages:** `TYPE (scope): description`, e.g.
  `FEATURE (linux): native Linux port`. Types seen upstream: `FEATURE`, `FIX`,
  `BEHAVIOR`, `DEV`, `CONTENT`, `RELEASE`.
- **PRs:** test locally first; keep them small; for UI changes include
  before/after screenshots. `.github/workflows/pr-build.yml` runs
  `npx nx build --configuration=production` (Node 20) on every PR — make sure a
  production build passes.
- `.github/copilot-instructions.md` documents the maintainer's automated-review
  flow (mention `@cursoragent` for a first review) and card-implementation rules.
