# Linux/Wine feasibility probes

Executable evidence that Firestone can run natively on Linux against Hearthstone
hosted by Wine/Proton. Each probe answers one question that was blocking the port.
They are diagnostics, not shipping code — but `memory/proc-memory.js` is the
reference implementation for the `ProcessFacade` replacement.

Verified on: Debian 13, KDE Plasma / KWin on X11, Proton (proton-cachyos-11.0)
via Lutris + umu, Hearthstone in a Battle.net prefix.

## Background: two different "injections"

The port was originally thought to be blocked because "injection doesn't work
under Wine". That conflated two unrelated mechanisms:

| Mechanism | What it does | Under Wine |
| --- | --- | --- |
| `@overwolf/ow-electron` overlay | Injects into the game, hooks D3D/DXGI, renders Chromium inside the game's swapchain | **Does not work.** Windows-specific hooking; must be replaced. |
| `UnitySpy` memory reading | `OpenProcess` + `ReadProcessMemory` from outside; never injects | **Works.** Ports to `/proc/<pid>/{maps,mem}`. |

Only the overlay actually injects. Confirmed against the shipped binary:

```
$ strings overwolf-plugins/UnitySpy.dll | grep -iE "ReadProcessMemory|CreateRemoteThread|LoadLibrary"
EnumProcessModulesEx
ReadProcessMemory
```

No `CreateRemoteThread`, no `LoadLibrary`, no `WriteProcessMemory`.

## overlay/

Answers: *can a native Linux Electron window act as the overlay over a Wine game?*

```bash
cd tools/linux-probe/overlay
npm install          # electron only; not wired into the Nx workspace
./run.sh                          # auto: Hearthstone -> Battle.net -> HDT
./run.sh --target='^Hearthstone$'
```

`Ctrl+Shift+O` toggles click-through, `Ctrl+Shift+Q` quits.

Result: **works.** Transparent ARGB window tracking the Wine window's exact
bounds, always-on-top over the focused window, click-through, 63fps.

Findings that matter for the real implementation:

- `app.commandLine.appendSwitch('enable-transparent-visuals')` is **required**.
  Without it KWin hands Chromium an opaque visual and `transparent: true`
  silently renders black rather than failing.
- Creating the window in the same tick as `app.whenReady()` also produces a
  black background; the probe delays 500ms.
- `focusable: false` makes Electron create an override-redirect window, so it
  never appears in `_NET_CLIENT_LIST` and KWin does not manage it. Good (KWin
  can't restack it under the game), but it also can't take focus — the
  interception path may need the window recreated rather than toggled.
- The probe draws over the game's coordinates **even when the game isn't
  focused**. Real code must wire show/hide to focus, which is what
  `overlay.service.ts`'s `game-focus-changed` handler does today.
- Requires the game in borderless-windowed, not exclusive fullscreen.

## memory/

Answers: *can a native Linux process read Hearthstone's Mono memory under Wine?*

```bash
cd tools/linux-probe/memory
./run.sh                     # auto-finds Hearthstone.exe
./run.sh --pid=12345
node selftest.js             # no game needed
```

Result: **works**, in pure Node, no native modules. Five stages: find process →
find `mono-2.0-bdwgc.dll` → parse its export table → resolve
`mono_get_root_domain` and decode its RIP-relative operand to locate the
`mono_root_domain` global → read `MonoDomain*` → discover `domain_assemblies`
and list all loaded assemblies.

Confirmed live: 1237 Mono exports parsed, `MonoDomain*` resolved,
`domain_assemblies` at `MonoDomain+0xa0`, 108 assemblies including
`Assembly-CSharp` — where Hearthstone's game state lives.

Findings that matter:

- Hearthstone is still **Unity Mono, not IL2CPP**
  (`MonoBleedingEdge/EmbedRuntime/mono-2.0-bdwgc.dll`), so UnitySpy's whole
  approach remains valid.
- Wine maps the **same PE file Blizzard ships on Windows**, unmodified, so Mono
  struct layouts are identical and UnitySpy's existing `MonoLibraryOffsets`
  should apply unchanged. The port is `ProcessFacade` and nothing above it.
- Wine maps PE modules into `/proc/<pid>/maps` with full file paths and
  section granularity; the lowest mapping of a path is the module base, which
  is what `EnumProcessModulesEx` + `GetModuleInformation` return.
- Reading `/proc/<pid>/mem` needs PTRACE_MODE_ATTACH *permission* but not an
  actual attach, so the game is never stopped or perturbed.
- Requires `kernel.yama.ptrace_scope=0` (Debian defaults to `1`, which allows
  reading descendants only). Alternatives for shipping: `CAP_SYS_PTRACE` on a
  helper binary, or launching the game as a child of the app.
- Offsets are **discovered by scanning**, not hardcoded, so the probe survives
  a Hearthstone patch and reports the offset it found.

`mono-probe.js` intentionally reports which stage it stopped at. Failing at
step 5 is benign (reads work, struct-layout guess missed). Failing at step 2
with no Mono module would mean a move to IL2CPP — which would invalidate
UnitySpy on every platform, not just Linux.

## The UnitySpy Linux port (done — proven working)

The memory-side port is **complete and verified against live Hearthstone**. Working
tree: `~/src/unity-spy-linux`. Reference patch: `unityspy-linux.patch` here.

The source is **not** in `Zero-to-Heroes/UnitySpy` — that repo's master is a stale
2019 fork containing only the GUI project. The live source is
**`Zero-to-Heroes/unity-spy-.net4.5`** (actively maintained; 219 files).

Total port: **97 insertions across 6 files**, plus `UnitySpy/Util/LinuxProcess.cs`.
Everything above the read primitives — all of HearthstoneLib, all Mono walking —
is untouched. Windows and Linux paths coexist behind `#if NET5_0_OR_GREATER`, so
this stays mergeable upstream rather than forking.

Verified live (net8.0, native Linux, Hearthstone under Proton):

```
[harness] exe path  = .../Hearthstone/Hearthstone.exe
[harness] unity ver = 2022.3.62.7762112
[harness] MindVision constructed in 568ms
  GetSceneMode      = HUB     (16ms)
  GetCollectionSize = 7470    (25ms)
  GetBoostersCount  = 1496    (12ms)
  GetMatchInfo      = <null>  (4ms)   # correct: not in a match
```

### The four non-obvious traps

1. **`FileVersionInfo` returns null on Linux for a native PE.** It only understands
   managed assembly metadata. The version resource must be parsed by hand.
2. **Read the version from StringFileInfo, NOT VS_FIXEDFILEINFO.** Blizzard
   overwrites the fixed info with Hearthstone's own version (`36.0.3.49395`);
   Unity's version survives only in the string block (`2022.3.62.7762112`), and
   that is what `MonoLibraryOffsets` matches (`"2022.3.62"`). Reading the fixed
   info — the obvious choice — silently finds no offsets.
3. **`Process.ProcessName` keeps the extension on Linux.** It comes from
   `/proc/pid/comm`, so a Wine game is `Hearthstone.exe` where Windows reports
   `Hearthstone`. `MindVision`'s default `inputProcessName = "Hearthstone"` finds
   nothing; it now falls back to `name + ".exe"`.
4. **`/proc/pid/exe` points at the Wine loader, not the game.** The game's PE path
   must come from the process' own mappings.

### Build

```bash
cd ~/src/unity-spy-linux
dotnet build LinuxHarness/LinuxHarness.csproj      # SDK-style net8.0 projects
dotnet run   --project LinuxHarness/LinuxHarness.csproj
```

The upstream `.csproj` files are old-style (`TargetFrameworkVersion v4.8`) and
cannot be built by `dotnet`; the port adds parallel SDK-style `*.Linux.csproj`
files alongside them rather than converting, so the Windows build is unaffected.

## npm install on Linux — what breaks (and the edge-js verdict)

`npm install` was run on this Debian box. Findings:

- **Package resolution and download: fully succeeds.** 1511 packages, 2.8G.
- **Both native addons compile cleanly on Linux.** `better-sqlite3` builds
  `better_sqlite3.node` and loads/runs. `electron-edge-js` compiles
  `build/Release/edge_coreclr.node` — a genuine ELF x86-64 addon (the prebuilt
  `lib/native/win32/...` binaries are Windows-only, but the fresh Linux build is
  the CoreCLR host, not the .NET Framework one).
- **The only failure is the `postinstall` script**, and it is not Linux-specific:
  `electron-builder install-app-deps` aborts with *"Application directory
  dist/apps/electron-app doesn't exist"* — a build-ordering issue (it wants a
  built app to rebuild native deps against) that hits any fresh checkout before
  the first `nx build electron-app`. The `electron-rebuild --only=better-sqlite3`
  step after it is then skipped, but better-sqlite3 already built during npm's
  own native phase.

### edge-js in-process CoreCLR hosting: technically present, practically a dead end

The `edge_coreclr.node` build prompted a real question: could edge-js load the
ported net8.0 UnitySpy **in-process**, avoiding a helper process entirely? A full
spike says no. Sequence of attempts against a live-game Electron harness:

1. Framework-dependent wrapper, no runtimeconfig → *"Could not find any
   runtimeconfig file"*. Fixed with `GenerateRuntimeConfigurationFiles`.
2. With runtimeconfig → *"missing dependencies manifest at
   /shared/Microsoft.NETCore.App/8.0.0/..."* — bare `/shared`, DOTNET_ROOT not
   honored.
3. Self-contained publish → **native assertion** `mode != host_mode_t::standalone`
   in edge-js's bundled `fx_muxer.cpp`. Its vendored host rejects self-contained.
4. Framework-dependent + `~/.dotnet` on PATH → CoreCLR finally boots and finds
   the net8.0 runtime, then fails binding edge-js's **own** managed embedding
   delegate: `coreclr_create_delegate() for GetFunc failed … 0x80070002`.

**Verdict:** edge-js 37's CoreCLR embedding is a .NET Core 2.x-era `fx_muxer`
host. It fights every step and is version-brittle. This is exactly the fragile
plumbing the **separate helper-process** design avoids — and that design is
already de-risked, because the identical net8.0 assemblies work perfectly under a
plain `dotnet run` (see LinuxHarness above). Recommendation: run the net8.0
MindVision as a helper process (stdio/JSON) behind the existing
`mind-vision-facade.interface.ts` seam, replacing
`libs/electron-edge-libs/mind-vision-edge.js`. Do **not** try to keep edge-js on
Linux.

The edge-js spike (`EdgeWrapper/`) is kept in `~/src/unity-spy-linux` as evidence.

## The helper process (built — transport proven end-to-end)

Since edge-js can't host .NET on Linux, MindVision runs as an **out-of-process
helper** the Node side drives over stdio. Both halves are built and the transport
is verified end-to-end.

**C# side** (`~/src/unity-spy-linux/MindVisionHelper/`): a net8.0 console app that
reads newline-delimited JSON-RPC on stdin, dispatches to the ported `MindVision`,
and writes JSON responses on stdout. stdout is protocol-only; logs go to stderr.
It recreates the mapping Overwolf's (source-unavailable) `StaticMindVisionWrapper`
did — all 36 facade method names → `MindVision` calls, with shape adapters for
`getCurrentScene`→`GetSceneMode` (int), `getRegion`→`GetCurrentRegion` (int),
`getBattlegroundsInfo`→`{Rating}`, `getBattlegroundsSelectedMode`→`'solo'|'duos'`.
Memory updates use `MindVision.ListenForChanges(1000, cb)` — the native push loop —
forwarded as `memoryUpdate` events. Published self-contained (native ELF launcher,
~73MB, no system .NET needed at runtime).

**Node side** (`libs/electron-edge-libs/mind-vision-edge-linux.js`): a drop-in with
the identical class surface to `mind-vision-edge.js` (constructor,
`setMemoryUpdateCallback`, `setLogger`, `initialize`, the 36 methods, `tearDown`).
It spawns the helper and correlates requests/responses by id. No edge-js, so it
runs under plain Node too.

**Wiring:** `mind-vision-electron.service.ts` now picks the bridge by platform —
`mind-vision-edge.js` on win32, `mind-vision-edge-linux.js` elsewhere. The build's
existing `libs/electron-edge-libs/**/*` asset glob copies the staged helper
(`mindvision-helper/`) into the output automatically, so no project.json change is
needed. The staged binaries are gitignored; regenerate with
`~/src/unity-spy-linux/publish-helper.sh`.

**Trap: `nx build` does not reliably refresh a changed helper in `dist/`.** After
re-publishing, the glob updated the `FirestoneMindVisionHelper` launcher but left the
**previous `FirestoneMindVisionHelper.dll`** in place — and the launcher is only an
apphost, so all the actual code came from the stale dll. The app kept serving the old
responses while the helper invoked by hand returned the fixed ones, which looks exactly
like a bug in the app rather than a build artifact. Always confirm the dll itself:

```bash
md5sum libs/electron-edge-libs/mindvision-helper/FirestoneMindVisionHelper.dll \
       dist/apps/electron-app/electron-edge-libs/mindvision-helper/FirestoneMindVisionHelper.dll
```

If they differ, `cp -r libs/electron-edge-libs/mindvision-helper/. dist/.../mindvision-helper/`
and `chmod +x` the launcher. The running app holds both binaries open (`Text file busy`),
so stop it before syncing.

Verified end-to-end under plain Node (game down, so live reads error gracefully as
designed; the reads themselves were proven earlier via LinuxHarness):

```
picked bridge    = mind-vision-edge-linux.js
initialize       = true      # spawns native helper, routes stderr->logger
isRunning        = false     # correct, game not running
getCurrentScene  = (Hearthstone is not running.)   # error propagated cleanly
tearDown         = ok
```

### Still to validate / do

- **Live data through the full bridge.** Every layer is proven except one
  combination: bridge → helper → real reads *with the game up*. The direct
  LinuxHarness proved the reads; the bridge test proved the transport; they
  haven't been run together against a live game yet. Run
  `node /tmp/bridge-integration.js` (or the electron app) with Hearthstone open.
- **Serialization shape parity.** The helper serializes with Newtonsoft, matching
  what Overwolf's wrapper produced, but the exact JSON of complex readers
  (decks, mercs, achievements) hasn't been diffed against what the Firestone
  parsers expect. Match-time methods especially need a real match to confirm.
- ~~`game-events-edge.js` (the HearthstoneReplays log parser) still needs the same
  net8.0 + helper treatment~~ — **done, see below.**

## The game-events parser (built — proven with real logs)

`HearthstoneReplays` (source: `Zero-to-Heroes/hs-game-converter-csharp-port`) is a
**pure log parser — no memory reads, no Windows APIs at all**, so it has zero Wine
dependency. Ported to net8.0 at `~/src/hs-converter-linux/` (258 files, 64k LOC).

The net8.0 port needed only three tiny fixes:

1. **21 unused `using System.Runtime.Remoting.Messaging;`** imports (`CallContext`,
   gone in .NET Core) — zero actual usages, just deleted the lines.
2. **`Utility.DeepClone` used `BinaryFormatter`** (throws at runtime on net8) — it
   had no call sites; redirected to the `Force.DeepCloner` the entity classes
   already use.
3. **`MercenariesHeroRevived.cs`** — a stale duplicate of `MercenariesHeroRevealed.cs`
   that still called `BuildGameState`/`CreateProvider` with a since-removed
   `gameState` argument. Commented out those two lines to match its working
   sibling. (Pre-existing, not a Linux issue; likely excluded from the real build.)

`DeepCloner` 0.10.4 and Newtonsoft resolve cleanly on net8.0 as-is.

**Helper** (`GameEventsHelper/`): net8.0 stdio JSON-RPC server hosting
`ReplayConverterPlugin`, self-contained native launcher. Game events are pushed as
`gameEvent` events — already JSON-serialized by the plugin, forwarded as-is.

**Bridge** (`libs/electron-edge-libs/game-events-edge-linux.js`): drop-in matching
`game-events-edge.js` (setGameEventCallback, setLogger, initialize,
initRealtimeLogConversion, realtimeLogProcessing, askForGameStateUpdate, tearDown).
`game-events-electron.service.ts` selects it by platform. Regenerate the staged
helper with `~/src/hs-converter-linux/publish-helper.sh`.

**Proven end-to-end** — unlike MindVision this needs no running game, only log
lines, so the parser itself was exercised with real data. Feeding
`test-tools/bg.log` (a real 24k-line Battlegrounds Power.log) through the full
bridge → helper → net8.0 parser:

```
initialize = true
feeding 23893 log lines...
total game events emitted: 453
     60 ZONE_POSITION_CHANGED
     52 BATTLEGROUNDS_LEADERBOARD_PLACE
     24 ARMOR_CHANGED
     23 MINION_SUMMONED
     18 DAMAGE ...
```

A second capture (`test-tools/sentry.log`, 19k lines) produced 157 events with no
errors. These are the semantic game events Firestone consumes, so the parser path
is fully validated — more so than any other layer, since it ran the real logic on
real data rather than just proving transport.

## `nx build electron-app` — succeeds on Linux

The full electron-app build **assembles cleanly on Linux**
(`Successfully ran target build`). The entire Linux port — both bridges, the
platform-selection edits — compiled without a single error; it was never the
blocker.

The only thing standing between the committed repo and a green build was a
**pre-existing dependency skew unrelated to the port**: the committed
`package-lock.json` pinned `@firestone-hs/simulate-bgs-battle@1.1.682`, but the
committed source references BG buff fields (`WhelpAttackBuff`, `VolumizerAttackBuff`,
…) that only exist in newer versions. One error, one file
(`bgs-player-board-parser.ts`). package.json's `^1.1.682` range already allowed the
fix; the lockfile was just stale.

**Fix applied:** bump `@firestone-hs/simulate-bgs-battle` to `1.1.721`
(`package.json` + lockfile, pulling `reference-data` in lockstep).

**Important — do NOT bump the whole `@firestone-hs` family to latest.** Doing that
introduced 28 *new* errors across arena/constructed/bgs (`TS2554 Expected 2
arguments`, required-vs-optional shape changes) — the latest versions carry
breaking changes the committed source isn't written against. The source needs a
specific intermediate set; only the one package actually referenced by the failing
code needed bumping. If more of these surface later, bump only the exact package
the erroring line needs, not the family.

**Build output is correct and complete:** `dist/apps/electron-app/` has `main.js`
(17MB), preload, worker, assets, and — verifying the whole helper design — both
Linux bridges (`mind-vision-edge-linux.js`, `game-events-edge-linux.js`) and both
self-contained native helper launchers
(`electron-edge-libs/{mindvision,game-events}-helper/`) landed at exactly the paths
the bridges resolve. The existing asset glob handled staging with no project.json
change.

Non-blocking: a pre-existing webpack warning `export 'LogFileBackend' was not found
in '@firestone/shared/common/service'` (a missing named export; build succeeds
regardless, unrelated to the port).

## `nx build electron-frontend` — succeeds (one more pre-existing fix)

The Angular frontend builds cleanly (8.15MB bundle). It needed one fix, again a
**pre-existing issue unrelated to the port**: `global-stats.service.ts:91` had a
`uploaderToken: ''` line **commented out by a developer** with the note "Add the
required uploaderToken property" — the `ReviewMessage` type (from
`build-global-stats`, already at latest) requires the field, but the half-finished
edit left it out, so the build failed. Uncommenting it (the token isn't used by
`extractStatsForGame`) fixes it. This is a stalled local edit in the committed
source, not version skew.

## Launching the app — blocked by the agent sandbox, not by the port

The app is built and ready to run, but it **cannot be launched from inside the
Claude Code tool sandbox**, which SIGKILLs any Electron GUI process that stays
alive long enough to render a window (exit 144, no output, main process never
runs). This was isolated carefully:

- `electron --version`, `ELECTRON_RUN_AS_NODE`, and a **minimal GUI app that
  creates a window and quits immediately** all work (exit 0, markers written).
- Any app that keeps a window open to render — minimal or real — dies with 144
  before its first line executes.

So this is an environment limitation of the sandbox, not a Firestone/Linux issue;
`ow-electron` and plain `electron` both run on this machine. The launch must be
done from a normal desktop session.

### How to launch it yourself

The dev launch loads the frontend from `http://localhost:4200` (the app is not
packaged when run this way). Two terminals:

```bash
# terminal 1 — serve the built frontend
cd ~/src/firestone/firestone
node_modules/.bin/http-server dist/apps/electron-frontend -p 4200 -s --cors

# terminal 2 — launch the app (plain electron or ow-electron)
cd ~/src/firestone/firestone
DISPLAY=:0 node_modules/@overwolf/ow-electron/dist/electron dist/apps/electron-app --no-sandbox
```

Or the maintainers' own flow: `nx serve electron-frontend` (dev server on :4200)
in one terminal, then `npm run start:ow-electron` in another.

What to expect on first launch: the main window should load the Firestone UI from
:4200. The **overlay** paths will fail (ow-electron's overlay package doesn't work
on Linux — that's what the overlay-probe replacement is for), and the app may need
login. The two helper processes spawn lazily on first memory/log call — watch for
`[helper] started` / `[game-events-helper] started` on stderr, and confirm the
native launchers exist at
`dist/apps/electron-app/electron-edge-libs/{mindvision,game-events}-helper/`.

This first real launch is the remaining unknown: whether the main process boots
cleanly under `ow-electron` on Linux (it hard-aborts if it needs Overwolf-native
services at startup — if so, fall back to plain `electron`), and whether the
overlay path throws fatally or degrades. Everything up to the launch is built and
verified.

## Port implications

- The memory-side port is `ProcessFacade` only — see `proc-memory.js`
  (~120 lines) for the `/proc`-based equivalent.
- `electron-edge-js` hosts the .NET **Framework** CLR in-process, which is
  Windows-only. The C# needs retargeting to `net8.0` and running as a helper
  process behind the existing 36-method `mind-vision-facade.interface.ts` seam.
  Note `libs/electron-edge-libs/*.js` hardcodes `edge.func({assemblyFile})` per
  method, so that swap touches every method.
- Keep UnitySpy in C# rather than porting Mono-walking to TypeScript:
  `UnitySpy.HearthstoneLib` encodes Hearthstone-specific offsets that shift on
  patch days and are maintained upstream at Zero-to-Heroes.
- Much of Firestone needs no memory access at all — `HearthstoneReplays.dll`
  parses the Power.log files, which live in the Wine prefix under
  `drive_c/users/<user>/AppData/Local/Blizzard/Hearthstone/Logs/` and are
  readable directly.
