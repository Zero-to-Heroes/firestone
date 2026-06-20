# Electron Migration Status — Firestone

> Last updated: 2026-06-20

This document tracks the remaining work to make the Electron (ow-electron) version of Firestone feature-complete and iso-functional with the Overwolf version.

---

## Legend

- ✅ Done — Implemented and functional
- 🟡 Partial — Implemented but incomplete or has known issues
- ❌ Not started — Stub, placeholder, or entirely missing

---

## 1. Core Architecture

| Task | Status | Notes |
|------|--------|-------|
| Main process bootstrap (`app.ts`) | ✅ | Single-instance, protocol handler, IPC, logging |
| Custom `ElectronAngularInjector` | 🟡 | Works, but all services are eagerly instantiated (no lazy loading) |
| `AbstractFacadeService` (main/renderer IPC) | ✅ | Handles cross-process communication |
| `isElectronContext()` / `isMainProcess()` detection | ✅ | Runtime platform branching works |
| Preload script (`main.preload.ts`) | ✅ | `electronAPI`, batched logging |

### Remaining tasks

- [ ] **Lazy service instantiation** — `electron-app-injector-setup.ts` instantiates everything upfront (`FIXME` on line 181). Implement lazy loading to improve startup time and memory usage.
- [ ] **Replace `null` for `OverwolfService`** — `DeckParserService` receives `null` where it expects an Overwolf service (`FIXME` on line 272). Needs a platform-agnostic replacement or null-safe handling in the service.

---

## 2. Window Management

| Task | Status | Notes |
|------|--------|-------|
| Overlay window (full-screen, in-game) | ✅ | Via ow-electron overlay API, auto-created on game inject |
| Settings window (normal + overlay mode) | ✅ | `ElectronWindowHandlerService` with DPI-aware overlay fallback |
| Window reload / relaunch | ✅ | `reloadWindows()`, `relaunchApp()` |
| Collection window (desktop) | ❌ | `showCollectionWindow` logs "not implemented" |
| Collection window (overlay) | ❌ | `toggleCollectionWindow` not implemented |
| Battlegrounds window (desktop) | ❌ | `toggleBattlegroundsWindow` logs "not implemented" |
| Battlegrounds window (overlay) | ❌ | Same as above |
| Main window (desktop companion) | ❌ | No main window at all — the Electron app is overlay-only with tray |

### Remaining tasks

- [ ] **Implement main desktop window** — The Overwolf version has a full desktop companion window with navigation (Decktracker, Battlegrounds, Arena, Replays, Achievements, Collection, Profile, Communities, Streams, Settings, Go Premium, Login). The Electron version currently has no equivalent — only a tray icon + overlay. This is the single largest gap.
- [ ] **Implement Collection window** — Both desktop and in-game overlay variants. The Overwolf version uses `COLLECTION_WINDOW` and `COLLECTION_WINDOW_OVERLAY`.
- [ ] **Implement Battlegrounds window** — Both desktop and in-game overlay variants. The Overwolf version uses `BATTLEGROUNDS_WINDOW` and `BATTLEGROUNDS_WINDOW_OVERLAY`.
- [ ] **Window position persistence** — Save/restore window positions across sessions (Overwolf handles this via manifest; Electron needs `electron-store` or similar).
- [ ] **Window resize handling** — The `electron-prep.md` lists "resize window" as a beta task. Ensure windows are properly resizable where expected.
- [x] **Multi-monitor support** — Overwolf uses `getMonitorsList()` for multi-display placement. Electron uses `screen.getAllDisplays()` via IPC.
- [ ] **Click-through / input passthrough** — Overwolf uses `InputPassThrough` window style for non-interactive overlay regions. Needs `setIgnoreMouseEvents()` on Electron overlay windows.
- [ ] **Inter-window messaging** — Overwolf uses `sendMessage()`/`onMessageReceived()`. Electron uses IPC — verify all window communication works.

---

## 3. Hotkeys

| Task | Status | Notes |
|------|--------|-------|
| Hotkey handler interface | ✅ | `IHotkeyHandlerService` with `HOTKEY_HANDLER_SERVICE_TOKEN` |
| Hotkey handler facade (Electron) | ✅ | `ElectronHotkeyHandlerFacadeService` delegates to `ElectronHotkeyHandlerService` |
| `addHotKeyHoldListener` | ✅ | Tab toggle; user-added hold listeners use 300ms fallback (no key-up from globalShortcut) |
| `addHotKeyPressedListener` | ✅ | Alt+C, Alt+B, Tab via `globalShortcut` |
| `addHotkeyChangedListener` | ✅ | Stub (no rebinding UI yet) |
| `removeHotKeyHoldListener` | ✅ | Implemented |
| `removeHotkeyChangedListener` | ✅ | Implemented |

### Remaining tasks

- [x] **Implement global hotkey registration** — Alt+C (collection), Alt+B (battlegrounds), Tab (live info toggle). Registered in `app.ts` after overlay ready.
- [ ] **Hotkey configuration UI** — Allow users to rebind hotkeys in Settings. Overwolf provides this natively; Electron needs a custom implementation (P2.1.4).
- [ ] **Hotkey changed events** — Notify the app when hotkeys are rebound (requires P2.1.4).

---

## 4. Low-Level Utilities (`OwUtilsService` / `LowLevelUtilsElectronService`)

Every method in `LowLevelUtilsElectronService` is implemented:

| Method | Status | Electron Approach |
|--------|--------|-------------------|
| `flashWindow()` | ✅ | Own windows: `BrowserWindow.flashFrame(true)`. External windows (the default `'Hearthstone'` target): Win32 `EnumWindows` + `FlashWindowEx` via `koffi` FFI to `user32.dll` (`win32-window-utils.ts`) |
| `showWindowsNotification()` | ✅ | Electron `Notification` API |
| `captureWindow()` | ✅ | `webContents.capturePage()` — returns `[dataUrl, dataUrl]` (Overwolf returns `[filePath, base64]`) |
| `captureActiveWindow()` | ✅ | Same as above |
| `copyImageDataUrlToClipboard()` | ✅ | `clipboard.writeImage(nativeImage.createFromDataURL())` |
| `deleteFileOrFolder()` | ✅ | `fs.rm()` with recursive/force |
| `copyFile()` | ✅ | `fs.copyFile()` |
| `renameFile()` | ✅ | `fs.rename()` |
| `copyFiles()` | ✅ | `fs.cp()` recursive |
| `downloadAndUnzipFile()` | ✅ | `https` + `extract-zip` |
| `downloadFileTo()` | ✅ | `https`/`http` + `fs.createWriteStream()` |
| `get()` | ✅ | No-op (plugin init not needed in Electron) |

### Remaining tasks

- [x] **Implement all file operation methods** — Straightforward Node.js `fs` module calls.
- [x] **Implement Windows notifications** — Electron's `Notification` API for OS-level toasts.
- [x] **Implement screen capture** — `webContents.capturePage()` for screenshot functionality.
- [x] **Implement clipboard image copy** — `electron.clipboard.writeImage()`.
- [x] **Flash the external Hearthstone window** — `BrowserWindow.flashFrame()` can only target the app's own windows. Flashing the game window's taskbar (used by `flashWindowOnYourTurn`) is done with the Win32 `EnumWindows` + `FlashWindowEx` calls via `koffi` FFI to `user32.dll`, replicating the legacy C# `FlashWindow.cs`. See `apps/electron-app/src/app/services/win32-window-utils.ts`.

### Notes / nuances

- **`flashWindow` is platform-aware**: it first tries Firestone's own Electron windows (`flashFrame`), then falls back to the Win32 path for external windows. `koffi` is wired like the other native modules: declared in `apps/electron-app/src/package.json`, added to `externalDependencies` in `apps/electron-app/project.json`, and unpacked from asar in `electron-builder.yml` (its prebuilt binary ships in `node_modules/@koromix/koffi-win32-x64`). It uses N-API, so no `electron-rebuild` step is needed.
- **`captureWindow` return shape differs from Overwolf**: Electron returns `[dataUrl, dataUrl]` (a PNG data URL in both slots) instead of Overwolf's `[savedFilePath, base64]`. The `NativeImage` is intentionally not returned because it is not structured-clone serializable across IPC. Current share consumers (clipboard share + the "both slots must be truthy" guard in `social-share-button.component.ts`) work with this. If Twitter/Reddit upload sharing is implemented for Electron later, it will need a real file path / raw bytes rather than the data URL.

---

## 5. API & Authentication

| Task | Status | Notes |
|------|--------|-------|
| HTTP GET/POST (`ElectronApiRunner`) | ✅ | Node.js `https`/`http` modules |
| `callPostApiSecure` (authenticated) | ❌ | Returns mock token — "authentication not implemented yet" |
| `secureUserToken` | ❌ | Mocked — returns dummy token |
| `generateNewToken` | ❌ | Mocked — returns dummy token |
| Protocol handler (`firestone://`) | ✅ | Auth deep links registered |

### Remaining tasks

- [ ] **Implement proper session token management** — The `ElectronApiRunner` has TODOs for secure token handling. Needs real token exchange with the Firestone backend.
- [ ] **Implement `callPostApiSecure`** — Currently mocked. Needed for authenticated API calls (game stats upload, user data, etc.).
- [ ] **Token refresh/rotation** — Implement token lifecycle management.

---

## 6. User Authentication & Accounts

| Task | Status | Notes |
|------|--------|-------|
| Custom auth (email/password) via deep link | ✅ | `StandaloneUserService` handles `firestone://` callbacks |
| Tebex integration (subscription) | 🟡 | `TebexHeadlessService` registered, but headless flow may be incomplete |
| Google OAuth | ❌ | Listed as "Final release" in `electron-prep.md` |
| Battle.net OAuth | ❌ | Listed as "Final release" in `electron-prep.md` |
| WeChat OAuth | ❌ | Listed as "Final release" in `electron-prep.md` |
| Premium status validation | 🟡 | `electron-prep.md` lists "validate that logged in user is premium" as pending |
| Welcome notification for premium | ❌ | Listed as pending in `electron-prep.md` |

### Remaining tasks

- [ ] **Implement Google OAuth provider** — Electron can use `BrowserWindow` for OAuth flow or system browser + deep link callback.
- [ ] **Implement Battle.net OAuth provider** — Same pattern as Google.
- [ ] **Implement WeChat OAuth provider** — For Chinese market.
- [ ] **Validate premium status on login** — Fetch and cache premium status, update UI accordingly.
- [ ] **Update welcome notification** — Show premium vs free status to user.

---

## 7. Subscriptions & Monetization

| Task | Status | Notes |
|------|--------|-------|
| `ElectronSubscriptionService` | ✅ | Registered in injector |
| `TebexHeadlessService` | ✅ | Headless Tebex integration |
| `StandaloneAdService` | ✅ | Registered — but effectively disables ads |
| Overwolf Ads (OwAd) | N/A | Not applicable to Electron |
| Plan management UI | ❌ | `electron-prep.md` lists "be able to subscribe to a new plan or manage existing plans" |
| Ad provider for Electron | ❌ | No ad SDK integrated |

### Remaining tasks

- [ ] **Implement subscription management UI** — Allow subscribing, upgrading, and managing plans via Tebex or custom payment flow.
- [ ] **Decide on ad strategy for Electron** — Either integrate a third-party ad SDK, use Tebex-only monetization, or go ad-free for Electron.
- [ ] **Premium feature gating** — Ensure premium-only features are properly gated based on subscription status.

---

## 8. Bug Reporting & Log Upload

| Task | Status | Notes |
|------|--------|-------|
| `BugReportService` | ✅ | Refactored to use `USER_SERVICE_TOKEN`; works with `StandaloneUserService` in Electron |
| `LogsUploaderService` | ✅ | `ElectronLogsUploaderService` — game logs via `LOG_FILE_BACKEND`, app logs via `userData/logs` |

### Remaining tasks

- [x] **Implement `BugReportService` for Electron** — Refactored to use `USER_SERVICE_TOKEN`; reuses existing service.
- [x] **Implement `LogsUploaderService` for Electron** — `ElectronLogsUploaderService` uses `LOG_FILE_BACKEND` and Node `fs` for app logs.

---

## 9. Social Features

| Task | Status | Notes |
|------|--------|-------|
| Twitter sharing | ❌ | No Electron implementation; Overwolf uses `overwolf.social.twitter` |
| Reddit sharing | ❌ | No Electron implementation; Overwolf uses `overwolf.social.reddit` |
| Clipboard sharing | ✅ | Via OverwolfService Electron fallbacks (placeOnClipboard/getFromClipboard) |
| Communities | 🟡 | Backend-driven — should work if API auth works |

### Remaining tasks

- [ ] **Implement Twitter sharing** — Use Twitter Web Intent URLs (`https://twitter.com/intent/tweet?text=...`) or OAuth + API.
- [ ] **Implement Reddit sharing** — Use Reddit API with OAuth or direct URL sharing.
- [x] **Implement clipboard copy for sharing** — Text via OverwolfService; image via `copyImageDataUrlToClipboard()` (P1.1).

---

## 10. Discord Integration

| Task | Status | Notes |
|------|--------|-------|
| Discord Rich Presence | ❌ | No Electron implementation; Overwolf uses `DiscordRPCPlugin` native plugin |

### Remaining tasks

- [ ] **Implement Discord Rich Presence** — Use `discord-rpc` npm package or `@xhayper/discord-rpc`. Set game mode, rank, hero, etc. as presence data.

---

## 11. Notifications

| Task | Status | Notes |
|------|--------|-------|
| In-app notifications (toasts) | ✅ | `NotificationsService` registered, overlay shows notifications |
| Windows OS notifications | ✅ | `showWindowsNotification()` via Electron `Notification` API |

### Remaining tasks

- [x] **Implement OS-level notifications** — Use Electron `Notification` API for Windows toast notifications (replays ready, achievements, etc.).

---

## 12. Game Integration

| Task | Status | Notes |
|------|--------|-------|
| Game detection (Hearthstone) | ✅ | ow-electron overlay with game ID 9898 |
| Game injection | ✅ | `event.inject()` on game-launched |
| Game focus/unfocus tracking | ✅ | `game-focus-changed` event |
| Game window resize tracking | ✅ | `game-window-changed` + `ElectronGameWindowService` |
| Memory reading (MindVision) | ✅ | `MindVisionElectronService` via `electron-edge-js` |
| Game events parsing | ✅ | `GameEventsElectronService` |
| Power.log tailing | ✅ | `ElectronLogFileBackendService` |
| Input tracking (mouse/keyboard in-game) | ❌ | Overwolf uses `inputTracking.onMouseUp`/`onKeyUp` |

### Remaining tasks

- [ ] **Implement in-game input tracking** — Overwolf provides `onMouseUp` and `onKeyUp` events for detecting player clicks/keys in-game. May need ow-electron's input APIs or native hooks.

---

## 13. In-Game Overlays

| Task | Status | Notes |
|------|--------|-------|
| Full-screen overlay container | ✅ | `ElectronOverlayComponent` renders `<full-screen-overlays>` |
| Decktracker (player/opponent) | ✅ | Included via `full-screen-overlays` |
| Battlegrounds overlays (board, hero selection, etc.) | ✅ | Included via `full-screen-overlays` |
| Arena overlays (draft, hero selection, mulligan) | ✅ | Included via `full-screen-overlays` |
| Secrets helper | ✅ | Included via `full-screen-overlays` |
| Turn timer | ✅ | Included via `full-screen-overlays` |
| Game counters | ✅ | Included via `full-screen-overlays` |
| Lottery widget | ✅ | Included via `full-screen-overlays` |
| Mercenaries team overlay | 🟡 | `electron-prep.md` lists "mercenaries widgets" as incomplete |
| Overlay positioning/dragging | ✅ | `start-overlay-dragging` IPC handler in `app.ts` |

### Remaining tasks

- [ ] **Verify all overlay widgets render correctly** — The `full-screen-overlays` component includes many sub-overlays. Need end-to-end testing to confirm all render and function properly in the ow-electron overlay window.
- [ ] **Complete Mercenaries widgets** — Listed in `electron-prep.md` as beta work. Needs Mercenaries store moved to shared module.
- [ ] **Overlay widget drag persistence** — Ensure dragged positions are saved and restored.

---

## 14. Data Storage

| Task | Status | Notes |
|------|--------|-------|
| SQLite database | ✅ | `SqliteDatabaseService` via `better-sqlite3` |
| Local storage replacement | ✅ | `ElectronStorageService` (JSON file in userData) |
| Disk cache | ✅ | `ElectronDiskCacheService` |
| Preferences storage | ✅ | `PreferencesStorageService` via `ElectronStorageService` |
| IndexedDB migration | 🟡 | `electron-prep.md` lists "indexeddb service (in settings-root.component)" |

### Remaining tasks

- [ ] **Verify IndexedDB usage in settings** — `electron-prep.md` flags this. Ensure settings components don't depend on IndexedDB (which may not work the same in Electron renderer).

---

## 15. Localization

| Task | Status | Notes |
|------|--------|-------|
| Translation service | ✅ | `TranslateService` + `LocalizationLoaderWithCache` |
| Default language (enUS) | ✅ | Set in injector setup |
| User-defined language at startup | ❌ | `electron-prep.md` lists "load user-defined language in electron-setup" as final release |

### Remaining tasks

- [ ] **Load user-preferred language at startup** — Currently hardcoded to `enUS`. Need to read language preference from storage and set it before app is ready.

---

## 16. System Tray

| Task | Status | Notes |
|------|--------|-------|
| Tray icon | ✅ | Custom icon, tooltip |
| Context menu (login/logout, settings, logs, restart, exit) | ✅ | Dynamic menu based on auth state |
| Tray click behavior | 🟡 | Currently only logs click — should open main window (when it exists) |
| "Reset window positions" menu item | ❌ | Overwolf tray has this; Electron version doesn't |

### Remaining tasks

- [ ] **Tray click opens main window** — When main desktop window is implemented, clicking the tray icon should show/focus it.
- [ ] **Add "Reset window positions" menu item** — Reset all overlay/window positions to defaults.

---

## 17. Auto-Update

| Task | Status | Notes |
|------|--------|-------|
| `electron-updater` integration | ✅ | `UpdateEvents` — auto-download, install on quit |
| Update check schedule | ✅ | On startup + every 4 hours |
| Update dialog | ✅ | Dialog when update is ready |
| S3 upload pipeline | ✅ | `upload-electron-updates.ts` with CloudFront/Cloudflare invalidation |
| Custom installer | 🟡 | `electron-prep.md` lists "custom installer (pending)" |

### Remaining tasks

- [ ] **Custom installer branding** — NSIS installer may need custom branding, uninstall survey, or first-run experience.

---

## 18. Build & Packaging

| Task | Status | Notes |
|------|--------|-------|
| Nx build targets | ✅ | `build`, `build-worker`, `serve`, `package`, `make` |
| `electron-builder.yml` | ✅ | NSIS x64, asarUnpack, extraResources |
| Post-pack optimization | ✅ | `electron-afterpack.js` strips unnecessary binaries |
| CI/CD publish pipeline | ✅ | `full-publish:ow-electron` + S3 upload |

### Remaining tasks

- [ ] **Code signing** — Sign the executable and installer for Windows SmartScreen trust.
- [ ] **Uninstall survey/window** — The Overwolf version has `uninstall.html`. Electron needs an equivalent (NSIS uninstall page or web redirect).

---

## 19. Twitch Integration

| Task | Status | Notes |
|------|--------|-------|
| Twitch auth | 🟡 | Backend-driven; needs API auth to work |
| Twitch extension overlay data | 🟡 | Should work if game state broadcasting works |
| Twitch settings UI | 🟡 | Depends on main desktop window existing |

### Remaining tasks

- [ ] **Verify Twitch extension integration** — Ensure game state data is broadcast to the Twitch extension backend.
- [ ] **Twitch settings in Electron settings** — May already work via the Settings window; needs verification.

---

## 20. Mods / Plugin System

| Task | Status | Notes |
|------|--------|-------|
| Mod manager | 🟡 | Backend services exist (`ModsManagerService`); file ops now implemented |
| In-game replay mod | 🟡 | `InGameReplayService` — file download/unzip now implemented |
| Mod configuration UI | 🟡 | Settings component exists, but depends on main/settings window |

### Remaining tasks

- [ ] **Verify mod system works** — `downloadAndUnzipFile()` and `downloadFileTo()` are now implemented. End-to-end verification needed.

---

## 21. Analytics & Telemetry

| Task | Status | Notes |
|------|--------|-------|
| Plausible analytics | 🟡 | `AnalyticsService` exists; should work if API calls work |

### Remaining tasks

- [ ] **Verify analytics events fire correctly** — Ensure `app-started`, navigation events, and pageviews are sent from the Electron app.

---

## 22. Miscellaneous Overwolf API Replacements

| Overwolf API | Electron Equivalent | Status |
|--------------|---------------------|--------|
| `overwolf.utils.placeOnClipboard()` | `clipboard.writeText()` via IPC | ✅ |
| `overwolf.utils.getFromClipboard()` | `clipboard.readText()` via IPC | ✅ |
| `overwolf.utils.getMonitorsList()` | `screen.getAllDisplays()` via IPC | ✅ |
| `overwolf.utils.getSystemInformation()` | `os` module via IPC | ✅ |
| `overwolf.utils.openUrlInDefaultBrowser()` | `shell.openExternal()` via IPC | ✅ |
| `overwolf.utils.openWindowsExplorer()` | `shell.openPath()` via IPC | ✅ |
| `overwolf.utils.openFilePicker()` | `dialog.showOpenDialog()` via IPC | ✅ |
| `overwolf.os.getRegionInfo()` | `app.getLocale()` + `Intl` via IPC | ✅ |

### Remaining tasks

- [x] **Implement clipboard read/write** — Electron `clipboard` module via IPC.
- [x] **Implement system info retrieval** — For bug reports and compatibility checks.
- [x] **Implement file picker dialog** — `dialog.showOpenDialog()` for importing decks, logs, etc.
- [x] **Implement region detection** — For locale-aware features.

---

## Priority Order (Suggested)

### Phase 1 — Core Functionality (High Impact)
1. **Low-level utilities** (file ops, notifications, clipboard) — Many features depend on these
2. **Hotkey system** — Critical for in-game usability
3. **API authentication** — Needed for stats upload, user data, premium validation
4. **Bug reporting & log upload** — Needed for beta testing feedback loop

### Phase 2 — Desktop Experience
5. **Main desktop window** — The largest single piece of work; enables collection browsing, stats viewing, deck building, etc.
6. **Collection & Battlegrounds windows** — Dedicated windows for these game modes
7. **Subscription/premium management** — Payment flow and feature gating

### Phase 3 — Feature Parity
8. **Social sharing** (Twitter, Reddit) — Quality-of-life feature
9. **Discord Rich Presence** — Community engagement
10. **Additional auth providers** (Google, Battle.net, WeChat)
11. **User-defined language loading**
12. **Mercenaries widgets completion**

### Phase 4 — Polish
13. **Custom installer** — Branding, first-run experience
14. **Code signing** — Trust & distribution
15. **Window position persistence & reset**
16. **Multi-monitor support improvements**
17. **In-game input tracking**
18. **Lazy service instantiation**
19. **Analytics verification**
20. **End-to-end overlay testing**

---

## Architecture Notes

### What works well
- The **abstraction layer** (`IWindowHandlerService`, `IHotkeyHandlerService`, injection tokens) cleanly separates platform-specific code.
- **`AbstractFacadeService`** effectively handles main↔renderer IPC in Electron.
- The **overlay system** using ow-electron is solid: game detection, injection, overlay creation, resize tracking all work.
- **Native integration** via `electron-edge-js` for MindVision memory reading is functional.
- **All in-game overlays** render through the shared `full-screen-overlays` component — no duplication needed.

### Key architectural decisions ahead
- **Main window strategy**: Should the Electron main window reuse the Angular components from the legacy Overwolf app, or be rebuilt? The legacy app uses Angular modules heavily tied to Overwolf window management. A clean approach might be to create a new `electron-main-window` route in `electron-frontend` that imports shared UI components.
- **OverwolfService dependency**: Many services still reference `OverwolfService` directly. Each usage needs to be audited and either abstracted behind an interface or replaced with platform-agnostic code.
- **Ads strategy**: The Overwolf version uses Overwolf's ad SDK. The Electron version needs a separate monetization strategy (Tebex-only, third-party ads, or ad-free).
