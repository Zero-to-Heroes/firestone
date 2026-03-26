# Electron Migration — Agent Todo List

> This document is a granular, ordered task list for completing the Electron (ow-electron) migration
> of Firestone to achieve iso-functional parity with the Overwolf version.
> Each task includes file paths, implementation guidance, and dependency information.
>
> **Convention**: Tasks are numbered as `P<phase>.<section>.<task>`. Mark `[x]` when complete.

## Notes from the dev

- The authentication and ways to get premium status (=retrieve packages) is something I'll need to look into myself, you won't be able to do anything.

---

## Phase 1 — Foundation (unblocks everything else)

These tasks have no dependencies and unblock the majority of later work.

---

### 1.1 Low-Level Utilities (`LowLevelUtilsElectronService`)

**File to edit:** `apps/electron-app/src/app/services/low-level-utils-electron.service.ts`
**Overwolf reference:** `libs/shared/framework/core/src/lib/services/ow-utils.service.ts` (wraps the native `OwUtils.dll` plugin)
**Interface contract:** `libs/shared/framework/core/src/lib/services/ow-utils.service.ts` — match the method signatures

Every method is currently a stub logging "not implemented". Implement each using Node.js / Electron APIs.
This service runs in the **main process**.

- [x] **P1.1.1** `deleteFileOrFolder(path)` — Use `fs.promises.rm(path, { recursive: true, force: true })`. Handle errors gracefully (e.g., file doesn't exist).
- [x] **P1.1.2** `copyFile(sourcePath, destinationDirectory)` — Use `fs.promises.copyFile()`. Extract the filename from `sourcePath` and join with `destinationDirectory`.
- [x] **P1.1.3** `renameFile(sourcePath, newName)` — Use `fs.promises.rename()`. Construct the new full path by replacing the basename. Return `true` on success.
- [x] **P1.1.4** `copyFiles(sourceDirectory, destinationDirectory)` — Use `fs.promises.cp(src, dest, { recursive: true })` (Node 16.7+). Create destination if it doesn't exist.
- [x] **P1.1.5** `downloadFileTo(fileUrl, path, targetFileName)` — Use Node `https`/`http` module to download to `fs.createWriteStream(join(path, targetFileName))`. Follow redirects. Return `true` on success.
- [x] **P1.1.6** `downloadAndUnzipFile(fileUrl, path)` — Download to a temp file using the logic from P1.1.5, then extract using `extract-zip` (already available) or `adm-zip`. If neither is a dependency, add `extract-zip`. Clean up temp file after extraction.
- [x] **P1.1.7** `flashWindow(windowName)` — Find the `BrowserWindow` by title matching `windowName` (or use `BrowserWindow.getAllWindows()`), call `win.flashFrame(true)`. Import `BrowserWindow` from `electron`.
- [x] **P1.1.8** `showWindowsNotification(title, text)` — Use Electron's `Notification` class: `new Notification({ title, body: text }).show()`. Import `Notification` from `electron`.
- [x] **P1.1.9** `captureWindow(windowName, copyToClipboard)` — Find window by name, call `win.webContents.capturePage()`, get `NativeImage`. If `copyToClipboard`, call `clipboard.writeImage(image)`. Return `[dataUrl, image]`.
- [x] **P1.1.10** `captureActiveWindow()` — Use `BrowserWindow.getFocusedWindow()?.webContents.capturePage()`. Return `[dataUrl, null]`.
- [x] **P1.1.11** `copyImageDataUrlToClipboard(dataUrl)` — `clipboard.writeImage(nativeImage.createFromDataURL(dataUrl))`. Import `clipboard` and `nativeImage` from `electron`.
- [x] **P1.1.12** `get()` — This was for Overwolf plugin initialization. Either make it a no-op that resolves immediately, or remove calls to it. Check callers in `ow-utils.service.ts` — the `get()` method loads the plugin. In Electron, the service is directly instantiated so this can be a no-op returning `Promise.resolve()`.

**Verification:** After implementing, search for all calls to these methods across the codebase and verify they are exercised. Key callers:

- `mods-manager.service.ts` — calls `downloadAndUnzipFile`, `deleteFileOrFolder`, `copyFile`
- `in-game-replay.service.ts` — calls `downloadFileTo`
- Various sharing/screenshot components — call `captureWindow`, `copyImageDataUrlToClipboard`

---

### 1.2 Clipboard & Utility IPC Bridge

Many components in the **renderer process** call `OverwolfService.placeOnClipboard()` / `getFromClipboard()` etc. These need an Electron equivalent exposed to renderer windows.

**Approach:** Add IPC handlers in the main process and expose them via the preload script, OR make the methods available directly in the renderer (Electron's `clipboard` module is available in renderer when `nodeIntegration: true`, which is the case here).

**Preload file:** `apps/electron-app/src/app/main.preload.ts`
**Components that call clipboard:** `copy-deckstring.component.ts`, `import-deckstring.component.ts`, `bgs-simulator.component.ts`, `decktracker-deck-name.component.ts`, `premium-desktop.component.ts`, `replay-info-ranked.component.ts`, `replay-info-generic.component.ts`, `mercenaries-team-root..component.ts`, `tavern-brawl-meta-decks.component.ts`, `tavern-brawl-stat.component.ts`, `constructed-deckbuilder-breadcrumbs.component.ts`

These all call `this.ow.placeOnClipboard(...)` or `this.ow.getFromClipboard()` via `OverwolfService`.

- [x] **P1.2.1** Create a platform-agnostic clipboard service or extend `OverwolfService` to handle Electron context.
    - **Option A (recommended):** In `overwolf.service.ts`, update `placeOnClipboard()` and `getFromClipboard()` to check `isElectronContext()` and use `require('electron').clipboard` when in Electron.
    - **Option B:** Create a new `IClipboardService` interface + injection token, with OW and Electron implementations. This is cleaner but requires updating ~15 component files.
    - Choose Option A for minimal disruption since `nodeIntegration: true` in all windows.

- [x] **P1.2.2** Similarly update `openUrlInDefaultBrowser(url)` in `OverwolfService` — when `!isOwEnabled()`, call `require('electron').shell.openExternal(url)`. Many components use this (ads, settings, replay buttons, error handlers, etc.).

- [x] **P1.2.3** Update `getMonitorsList()` in `OverwolfService` — when `!isOwEnabled()`, use `require('electron').screen.getAllDisplays()` and map to the expected format.

- [x] **P1.2.4** Update `getSystemInformation()` in `OverwolfService` — when `!isOwEnabled()`, use `os.cpus()`, `os.totalmem()`, `os.platform()`, etc. to return a compatible structure.

- [x] **P1.2.5** Update `openWindowsExplorer(path)` — when `!isOwEnabled()`, use `require('electron').shell.openPath(path)`.

- [x] **P1.2.6** Update `openAppFilePicker(filter)` — when `!isOwEnabled()`, use `require('electron').dialog.showOpenDialog()` with appropriate filter options. This is called from the renderer, so you may need an IPC call to the main process (dialogs must be opened from main process or use `remote`). Add an IPC handler in `app.ts` and call it via `ipcRenderer.invoke('show-open-dialog', options)`.

- [x] **P1.2.7** Update `getRegionInfo()` — when `!isOwEnabled()`, use `Intl.DateTimeFormat().resolvedOptions().timeZone` or `os.locale()` (Node 21+) or `app.getLocale()` to determine region.

**Verification:** Each of these methods has specific callers listed in the migration status doc. After implementing, do a test run of the Electron app and verify clipboard, URL opening, and file picker work.

---

### 1.3 API Authentication

**File to edit:** `libs/electron/common/src/lib/electron-api-runner.service.ts`
**Overwolf reference:** `libs/shared/framework/core/src/lib/services/api-runner.ts` — see how `secureUserToken` and `callPostApiSecure` work in OW

- [ ] **P1.3.1** Study the OW `ApiRunner.secureUserToken()` implementation — it calls `OverwolfService.getCurrentUser()` and `OverwolfService.generateSessionToken()` to get an OW session token, then exchanges it with the Firestone backend. Understand the backend endpoint (likely `api.firestoneapp.com` or similar) and what tokens it expects/returns.

- [ ] **P1.3.2** Implement `secureUserToken()` in `ElectronApiRunner` — use the `StandaloneUserService` to get the current user's auth token (from the deep link login flow). If the user has a JWT or similar token from the `firestone://` auth callback, use that as the bearer token.

- [ ] **P1.3.3** Implement `generateNewToken()` — if tokens expire, implement refresh logic. This may involve calling a backend endpoint with the refresh token.

- [ ] **P1.3.4** Implement `callPostApiSecure(url, body)` — same as `callPostApi` but adds the auth token from `secureUserToken()` as a header (e.g., `Authorization: Bearer <token>`). The OW version adds `sessionToken` to the request.

- [ ] **P1.3.5** Verify by testing an authenticated API call (e.g., uploading game stats or fetching user data).

---

### 1.4 Bug Reporting & Log Upload

**Injector file:** `apps/electron-app/src/app/services/electron-app-injector-setup.ts` (lines 437, 459, 460 pass `null`)
**OW implementation:** `libs/shared/common/service/src/lib/services/bug-report.service.ts`
**OW implementation:** `libs/shared/common/service/src/lib/services/logs-uploader.service.ts`

- [x] **P1.4.1** Read `bug-report.service.ts` to understand what it does — it collects logs, system info, user context, and uploads to S3 or a backend. Check what `OverwolfService` methods it calls (likely `getRunningGameInfo()`, `getCurrentUser()`, `readTextFile()`, `getSystemInformation()`).

- [x] **P1.4.2** Read `logs-uploader.service.ts` — understand what logs it collects and where it uploads them.

- [x] **P1.4.3** Create `ElectronBugReportService` in `apps/electron-app/src/app/services/`. Either:
    - Make the existing `BugReportService` work in Electron by ensuring all its `OverwolfService` dependencies have Electron fallbacks (preferred if the OW calls are few and already handled by P1.2.x), OR
    - Create a new Electron-specific implementation that uses Node.js `fs` to read log files from `app.getPath('userData')/logs`, `os` module for system info, and uploads via `ElectronApiRunner`.
    - **Done:** Refactored `BugReportService` to use `USER_SERVICE_TOKEN` instead of `OverwolfService` for `getCurrentUser()`; reuses existing service in Electron.

- [x] **P1.4.4** Create `ElectronLogsUploaderService` or make the existing one work — same approach as above.
    - **Done:** Created `ElectronLogsUploaderService` in `apps/electron-app/src/app/services/electron-logs-uploader.service.ts` — uses `LOG_FILE_BACKEND` for game logs, Node `fs` for app logs (`userData/logs`).

- [x] **P1.4.5** Register both in the injector setup. Replace the `null` values:
    - Line 437: `null, // BugReportService` → the new service instance
    - Line 459: `null, // BugReportService` → same
    - Line 460: `null, // LogUploader` → the new service instance

- [x] **P1.4.6** Verify by triggering a bug report from the settings or overlay.

---

## Phase 2 — Hotkeys

**Depends on:** Nothing (can run in parallel with Phase 1)

---

### 2.1 Hotkey Registration System

**Files to edit:**

- `apps/electron-app/src/app/services/electron-hotkey-handler.service.ts` (main process)
- `apps/electron-app/src/app/services/electron-hotkey-handler-facade.service.ts` (facade)
  **Interface:** `libs/shared/framework/core/src/lib/services/hotkey-handler.interface.ts`
  **OW reference:** `libs/app/ow-native/src/lib/services/ow-hotkey-handler.service.ts`
  **OW manifest hotkeys:**
- `collection`: Alt+C (toggle main/collection window)
- `battlegrounds`: Alt+B (toggle battlegrounds window)
- `live-info`: Tab (hold — press and hold behavior for BG info)

- [x] **P2.1.1** Read the `IHotkeyHandlerService` interface to understand the full API contract:
    - `addHotKeyPressedListener(hotkey, callback)` — register a hotkey, fire callback on press
    - `addHotKeyHoldListener(hotkey, onDown, onUp)` — register a hold hotkey, fire onDown when pressed, onUp when released
    - `addHotkeyChangedListener(callback)` — notify when user rebinds
    - `removeHotKeyHoldListener(listener)` / `removeHotkeyChangedListener(listener)` — cleanup

- [x] **P2.1.2** Implement `ElectronHotkeyHandlerService` using Electron's `globalShortcut` module:
    - `addHotKeyPressedListener(hotkey, callback)`: Convert the hotkey string (e.g., `"Alt+C"`) to Electron accelerator format (same format), call `globalShortcut.register(accelerator, callback)`. Store the registration for later removal.
    - Note: `globalShortcut` only fires on key-down, not key-up. For hold behavior, you'll need a different approach.

- [x] **P2.1.3** Implement hold behavior for `addHotKeyHoldListener`:
    - **Done:** For Tab (live-info), use toggle behavior: press = show, press again = hide (since `globalShortcut` has no key-up). For user-added hold listeners, fire onDown then onUp after 300ms as fallback.

- [ ] **P2.1.4** Implement hotkey storage and user rebinding:
    - Store hotkey bindings in preferences (via `PreferencesService`).
    - Load stored bindings on startup.
    - Implement `addHotkeyChangedListener` to notify when bindings change.
    - When a binding changes, unregister the old `globalShortcut` and register the new one.
    - **Deferred:** Using hardcoded defaults (Alt+C, Alt+B, Tab) for now.

- [x] **P2.1.5** Wire the `ElectronHotkeyHandlerFacadeService` to delegate to `ElectronHotkeyHandlerService`:
    - Facade now delegates to `ElectronHotkeyHandlerService`; `liveInfoKeyPressed$$` synced via `setupElectronSubject`.

- [x] **P2.1.6** Register hotkeys at startup — in `app.ts` or the injector setup, after services are ready, register the default hotkeys:
    - Alt+C → toggle collection window
    - Alt+B → toggle battlegrounds window
    - Tab → toggle live info overlay (press to show, press again to hide)

- [x] **P2.1.7** Handle hotkey conflicts — `globalShortcut.register` returns `false` if the shortcut is already taken by another app. Log a warning.

- [x] **P2.1.8** Clean up hotkeys on app quit — in `app.ts`'s `will-quit` handler, call `globalShortcut.unregisterAll()`.

**Verification:** With the app running and Hearthstone open, press Alt+C, Alt+B, and hold Tab. Confirm callbacks fire. Check that hotkeys are unregistered on app exit.

---

## Phase 3 — Authentication & Subscriptions

**Depends on:** P1.3 (API Authentication)

---

### 3.1 Premium Status Validation

**Files:**

- `libs/electron/common/src/lib/standalone-user.service.ts`
- `libs/shared/common/service/src/lib/services/subscription/subscription.service.ts`
- `libs/electron/common/src/lib/electron-subscription.service.ts`
- `libs/shared/common/service/src/lib/services/subscription/tebex.service.ts` / `tebex-headless.service.ts`

- [ ] **P3.1.1** Read `StandaloneUserService` to understand the current auth flow. It handles `firestone://` deep link callbacks. Check what user data it stores and what `user$$` emits.

- [ ] **P3.1.2** Read the OW `SubscriptionService` to understand how premium status is determined — it uses `OverwolfService.getActiveSubscriptionPlans()` and `onSubscriptionChanged()`. For Electron, this needs to use Tebex or a custom backend.

- [ ] **P3.1.3** Ensure `ElectronSubscriptionService` properly queries premium status from the backend after login. It should:
    - Call a backend endpoint with the user's auth token
    - Parse the response to determine subscription tier
    - Emit on `hasPremiumSub$$` BehaviorSubject
    - Periodically re-check (or listen for webhooks via the backend)

- [ ] **P3.1.4** Update welcome notification — after login and premium check, if premium, show a notification: "Welcome, Premium user!" via `NotificationsService`. Check `electron-prep.md` for the expected behavior.

---

### 3.2 Additional OAuth Providers

- [ ] **P3.2.1** **Google OAuth** — Implement OAuth2 PKCE flow:
    - Open `https://accounts.google.com/o/oauth2/v2/auth` in system browser via `shell.openExternal()`
    - Set redirect URI to `firestone://auth/google`
    - Handle the callback in `app.ts`'s protocol handler
    - Exchange the auth code for tokens via the Firestone backend
    - Pass the user info to `StandaloneUserService`
    - Register this provider in the login UI

- [ ] **P3.2.2** **Battle.net OAuth** — Same pattern as Google:
    - Authorization URL: `https://oauth.battle.net/authorize`
    - Redirect URI: `firestone://auth/battlenet`
    - Exchange code for tokens
    - Fetch user profile from `https://oauth.battle.net/userinfo`

- [ ] **P3.2.3** **WeChat OAuth** — Same pattern, WeChat-specific endpoints. Lower priority (Chinese market).

- [ ] **P3.2.4** Update the login UI (in settings or tray) to show provider selection buttons.

---

### 3.3 Subscription Management UI

- [ ] **P3.3.1** Read how the OW version handles subscription — `premium-desktop.component.ts` and `premium-package.component.ts` in `libs/app/view/`. They use `OverwolfService.openStore()` to open the Overwolf subscription page.

- [ ] **P3.3.2** For Electron, implement a Tebex checkout flow:
    - Open Tebex checkout URL in system browser or an in-app `BrowserWindow`
    - Handle payment completion callback via deep link or webhook
    - Update `ElectronSubscriptionService` with new subscription status

- [ ] **P3.3.3** Add subscription management to the settings window (or main window when it exists):
    - Show current plan
    - Button to upgrade/change plan
    - Button to cancel (links to Tebex management page)

---

## Phase 4 — Desktop Windows

**Depends on:** P1.2 (clipboard/utility bridge), P2.1 (hotkeys — for window toggle hotkeys)

This is the **largest body of work**. The Overwolf version has separate windows for Collection, Battlegrounds, and Settings, all sharing the same `main-window` component with tabbed navigation. The Electron version currently only has an overlay and a settings window.

---

### 4.1 Architecture Decision: Main Window Strategy

Before implementing, decide on the approach:

**Option A — Reuse legacy components directly:**

- Add a new route `/main` to `apps/electron-frontend/src/app/app.routes.ts`
- Create `ElectronMainWindowComponent` that wraps `<main-window>` from the legacy module
- Import `LegacyFeatureShellModule` into the Electron frontend module
- **Challenge:** The legacy module imports `OverwolfService` in ~80 files. Would need all P1.2.x platform bridges done first.

**Option B — New shell, shared content components:**

- Create a new Electron-native shell (menu, window chrome, navigation) that imports only the _content_ components (decktracker, battlegrounds-desktop, collection, etc.) without the legacy window management
- **Advantage:** Cleaner separation, no dependency on `OverwolfService` in the shell
- **Challenge:** More new code to write, but content components are already in separate libs

- [ ] **P4.1.1** Evaluate both options by checking which content components (e.g., `replays`, `collection`, `decktracker`, `battlegrounds-desktop`, `arena-desktop`, `achievements`, `stats-desktop`, `communities-desktop`, `mercenaries-desktop`, `premium-desktop`) are in separate importable libs vs embedded in `legacy/feature-shell`.
    - Look at each component's module location
    - Check if they import `OverwolfService` directly
    - Count dependencies on Overwolf-specific code
    - The answer determines the feasibility of each approach

- [ ] **P4.1.2** Document the chosen approach and create sub-tasks accordingly.

---

### 4.2 Create Main Desktop Window (BrowserWindow)

- [ ] **P4.2.1** Add the main window creation logic to `ElectronWindowHandlerService`:
    - Create a new `BrowserWindow` (not overlay) with size ~1440x790 (matching OW's `CollectionWindow`)
    - Use `transparent: true`, `frame: false` (custom titlebar like OW)
    - Load `electron-frontend` URL with route `#/main`
    - Store reference to the window; handle `closed` event
    - On tray click and Alt+C hotkey, show/focus this window

- [ ] **P4.2.2** Add `/main` route to `apps/electron-frontend/src/app/app.routes.ts`:

    ```
    { path: 'main', component: ElectronMainWindowComponent }
    ```

- [ ] **P4.2.3** Create `ElectronMainWindowComponent` in `apps/electron-frontend/src/app/overlay/`:
    - Template should include:
        - Custom window titlebar with minimize/maximize/close buttons (IPC calls to main process)
        - Navigation sidebar (matching OW's `menu-selection` tabs)
        - Content area that switches between views
    - Wire up window controls: minimize → `ipcRenderer.send('minimize-main-window')`, etc.
    - Add corresponding IPC handlers in `app.ts`

- [ ] **P4.2.4** Implement the navigation sidebar with these sections (matching OW):
    - Decktracker (Constructed)
    - Battlegrounds
    - Arena
    - Tavern Brawl
    - Mercenaries

    ***
    - Replays
    - Achievements
    - Collection

    ***
    - Profile
    - Communities
    - Streams

    ***
    - Go Premium
    - Login/Logout

- [ ] **P4.2.5** Import and render content components for each tab. These are the components to target (check if they can be imported without OW dependencies):
    - `decktracker` — from `libs/constructed/`
    - `battlegrounds-desktop` — from `libs/battlegrounds/view/`
    - `arena-desktop` — from `libs/arena/`
    - `replays` — from `libs/stats/`
    - `achievements` — from `libs/achievements/`
    - `collection` — from `libs/collection/`
    - `communities-desktop` — from `libs/communities/`
    - `mercenaries-desktop` — from `libs/mercenaries/`
    - `stats-desktop` — from `libs/stats/`
    - `premium-desktop` — from `libs/app/view/`
    - `streams-desktop` — from `libs/mainwindow/` or `libs/twitch/`
    - `tavern-brawl-desktop` — from `libs/legacy/feature-shell` (may need extraction)

- [ ] **P4.2.6** Implement window controls in the main process:
    - IPC handlers: `minimize-main-window`, `maximize-main-window`, `close-main-window`, `drag-main-window`
    - Window state persistence (position + size) — save to `ElectronStorageService` on `move`/`resize` events, restore on creation

- [ ] **P4.2.7** Wire the tray icon click to show/focus the main window:
    - Edit `apps/electron-app/src/app/services/system-tray.ts`
    - In the `tray.on('click')` handler, get the main window from `ElectronWindowHandlerService` and call `show()` + `focus()`

---

### 4.3 Implement Collection Window Toggle

- [ ] **P4.3.1** In `ElectronWindowHandlerService`, implement `showCollectionWindow(useOverlay)`:
    - If `useOverlay` and game is running: create an `OverlayBrowserWindow` via ow-electron overlay API, load `#/main` with collection tab active (or a query param like `#/main?tab=collection`)
    - If desktop mode: show/focus the main window and navigate to collection tab
    - Reuse the main window rather than creating a separate window (unlike OW which has separate Collection windows)

- [ ] **P4.3.2** Implement `toggleCollectionWindow(useOverlay, options)`:
    - If window is visible, hide/close it
    - If window is hidden/closed, show it (using logic from P4.3.1)
    - Handle `options.forced` ('open' | 'closed') and `options.canBringUpFromMinimized`

---

### 4.4 Implement Battlegrounds Window Toggle

- [ ] **P4.4.1** In `ElectronWindowHandlerService`, implement `toggleBattlegroundsWindow(useOverlay, options)`:
    - Similar to collection but navigates to battlegrounds tab
    - In OW, this is a separate window with its own layout (`battlegrounds.component.ts`). Decide whether to:
        - (A) Use a tab in the main window, or
        - (B) Create a separate BrowserWindow like OW does
    - Option A is simpler; Option B matches OW behavior exactly. OW uses a separate window because BG has a unique layout with its own menu bar. Consider Option B.

- [ ] **P4.4.2** If choosing Option B (separate window): create a new BrowserWindow/OverlayBrowserWindow, load `#/battlegrounds` route, create the route and component in `electron-frontend`.

---

### 4.5 Window Position Persistence & Reset

- [ ] **P4.5.1** Create a utility to save/restore window bounds:
    - On window `move` and `resize` events, debounce and save `{ x, y, width, height }` to `ElectronStorageService` keyed by window name
    - On window creation, read stored bounds and apply them, falling back to defaults
    - Validate bounds are within screen area (handle monitor changes)

- [ ] **P4.5.2** Implement "Reset window positions" tray menu item:
    - Add to `system-tray.ts` context menu
    - Clear all stored window positions
    - Close and reopen windows at default positions

- [ ] **P4.5.3** Persist overlay widget positions (drag offsets):
    - The overlay widgets can be dragged. Check if `PreferencesService` already stores positions (it likely does, as the OW version uses preferences for this).
    - Verify the positions are loaded and applied on overlay creation.

---

### 4.6 Click-Through / Input Passthrough

**File:** `apps/electron-app/src/app/services/overlay.service.ts`
**OW reference:** `overwolf.windows.setWindowStyle('InputPassThrough')` used in `_full-screen-overlays.component.ts`

- [ ] **P4.6.1** Implement click-through for the overlay window:
    - The overlay window covers the entire game. Non-widget areas must pass clicks through to the game.
    - Use `win.setIgnoreMouseEvents(true, { forward: true })` on the overlay window. The `forward: true` option still sends mouse events to the renderer for hover detection.
    - Alternatively, handle this at the CSS level with `pointer-events: none` on the overlay container and `pointer-events: auto` on interactive widgets.

- [ ] **P4.6.2** Verify that all overlay widgets are clickable while the rest of the overlay passes clicks through. Test dragging widgets, clicking buttons, and interacting with the game behind the overlay.

---

## Phase 5 — Feature Parity Services

**Depends on:** P1.x (foundation), P4.x (desktop windows for some features)

---

### 5.1 Social Sharing

**OW files:**

- `libs/legacy/feature-shell/src/lib/js/components/sharing/twitter/twitter-share-modal.component.ts`
- `libs/legacy/feature-shell/src/lib/js/components/sharing/reddit/reddit-share-modal.component.ts`
- `libs/legacy/feature-shell/src/lib/js/services/mainwindow/store/processors/social/share-video-on-social-network-processor.ts`

These all call `OverwolfService.twitterShare()`, `redditShare()`, etc.

- [ ] **P5.1.1** For Twitter sharing: Replace `OverwolfService.twitterShare(...)` with opening a Twitter Web Intent URL:

    ```
    shell.openExternal(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`)
    ```

    Update `OverwolfService.twitterShare()` to handle `!isOwEnabled()` case, or create a branch in the sharing components.

- [ ] **P5.1.2** For Reddit sharing: Open Reddit submit URL:

    ```
    shell.openExternal(`https://www.reddit.com/submit?title=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`)
    ```

    This loses the ability to choose subreddit/flair in-app, but is the simplest approach. For richer integration, implement Reddit OAuth + API posting.

- [ ] **P5.1.3** Update the sharing UI components to work without OW social login. The Twitter/Reddit login flow in OW is OW-specific. For Electron:
    - Remove the login step (web intents don't need it)
    - Update the modal to just compose the share text and open the URL
    - Or hide the social sharing buttons entirely if web intents are sufficient

---

### 5.2 Discord Rich Presence

**OW implementation:** Uses `DiscordRPCPlugin` loaded via `overwolf.extensions.current.getExtraObject`
**OW files:** `libs/discord/` — `DiscordRpcService`, `PresenceManagerService`

- [ ] **P5.2.1** Add `discord-rpc` or `@xhayper/discord-rpc` as a dependency: `npm install discord-rpc`

- [ ] **P5.2.2** Create `ElectronDiscordRpcService` in `apps/electron-app/src/app/services/`:
    - Initialize the Discord RPC client with the Firestone Discord application ID (find it in the existing `DiscordRpcService` or `PresenceManagerService`)
    - Connect on app startup
    - Expose `setPresence(data)` method

- [ ] **P5.2.3** Read `libs/discord/src/lib/services/discord-rpc.service.ts` and `presence-manager.service.ts` to understand what presence data is set (game mode, hero, rank, etc.).

- [ ] **P5.2.4** Wire the Electron Discord service to the same game state events that the OW version uses. Register it in the injector and subscribe to game state changes to update presence.

---

### 5.3 OS Notifications

- [ ] **P5.3.1** Already handled by P1.1.8 (`showWindowsNotification`). Verify that notification callers work:
    - Achievement notifications (`AchievementsNotificationService`)
    - Replay notifications (`ReplaysNotificationService`)
    - Card notifications (`CardNotificationsService`)
    - Firestone-ready notification (already works in `overlay.service.ts` as in-app notification)

---

### 5.4 Localization — User-Defined Language

**File:** `apps/electron-app/src/app/services/electron-app-injector-setup.ts` (line 346: `translate.setDefaultLang('enUS')`)
**Preference key:** Check `PreferencesService` for a `locale` or `language` field

- [ ] **P5.4.1** Before setting the default language, read the user's language preference from storage:

    ```typescript
    const prefs = await preferencesStorage.getPreferences();
    const userLang = prefs?.locale ?? 'enUS';
    translate.setDefaultLang(userLang);
    translate.use(userLang);
    ```

    This requires `PreferencesStorageService` to be initialized before `TranslateService`, which it already is in the injector setup.

- [ ] **P5.4.2** Verify that changing language in Settings takes effect (may require app restart or live reload).

---

### 5.5 Mercenaries Widgets

**Reference:** `electron-prep.md` lists "mercenaries widgets (move store to shared module, like game-state)"

- [ ] **P5.5.1** Check if `libs/mercenaries/` components work in the Electron overlay. The `full-screen-overlays` component includes mercenaries overlays. If they render but lack state, the issue is the Mercenaries store not being initialized.

- [ ] **P5.5.2** Verify `MercenariesMemoryCacheService` and `MercenariesReferenceDataService` are properly registered (they are in the injector — check if they initialize correctly).

- [ ] **P5.5.3** If the Mercenaries store is in `legacy/feature-shell`, extract it to a shared lib (like `game-state` pattern) so it can be used by both OW and Electron. This may involve moving store services, reducers, and effects.

---

## Phase 6 — OverwolfService Decoupling (Ongoing)

This is an ongoing effort needed for the desktop window components. Each component that imports `OverwolfService` needs to either:

- Use the platform bridge methods added in P1.2.x (for clipboard, URL, etc.)
- Be wrapped in `if (ow?.isOwEnabled())` guards (for OW-only features)
- Have the OW call replaced with a platform-agnostic alternative

**There are ~90 files that import OverwolfService.** This list is for the most critical/blocking ones.

---

### 6.1 Core Services Using OverwolfService

- [ ] **P6.1.1** `user.service.ts` — Uses `ow.getCurrentUser()`, `ow.addLoginStateChangedListener()`. For Electron, this service should use `StandaloneUserService` via the `USER_SERVICE_TOKEN`. Verify this token resolution works in renderer components.

- [ ] **P6.1.2** `api-runner.ts` — Uses `ow.getCurrentUser()`, `ow.generateSessionToken()`. For Electron, the `ElectronApiRunner` replaces this entirely via token. Verify all API calls go through the injected `ApiRunner`.

- [ ] **P6.1.3** `analytics.service.ts` — Uses `ow.getMainWindow()['plausibleInstance']`. For Electron, Plausible should be initialized differently. Either initialize it in the main process and expose via IPC, or initialize in each renderer window.

- [ ] **P6.1.4** `cards-facade.service.ts` — Uses `ow.getMainWindow()` to get a shared card service instance. In Electron, `WindowManagerService` handles this. Verify the Electron path works.

- [ ] **P6.1.5** `window-manager.service.ts` — Uses `ow.getMainWindow()`. Has Electron branching. Verify it works.

- [ ] **P6.1.6** `game-info.service.ts` — Already has Electron branching. Verify.

---

### 6.2 UI Components Using OverwolfService Directly

For each of these, the fix is usually one of:

- Replace `this.ow.placeOnClipboard(x)` → use clipboard bridge from P1.2.1
- Replace `this.ow.openUrlInDefaultBrowser(url)` → use URL bridge from P1.2.2
- Replace `this.ow.getCurrentWindow()` → use Electron-compatible window info
- Guard with `if (this.ow?.isOwEnabled())` for OW-only behavior

Group by usage pattern:

**Clipboard users (15 files):**

- [ ] **P6.2.1** Update all clipboard calls — after P1.2.1 is done, these should work automatically if `OverwolfService` methods handle the Electron case.

**URL opener users (12+ files):**

- [ ] **P6.2.2** Update all `openUrlInDefaultBrowser` calls — after P1.2.2, these should work automatically.

**Window management (control-\*.component.ts, window-wrapper, etc.):**

- [ ] **P6.2.3** The window control components (`control-close`, `control-minimize`, `control-maximize`, `control-bug`, `window-wrapper`) use OW window APIs. For Electron, these need to use `BrowserWindow` APIs via IPC. This is needed for the main desktop window (Phase 4). Implement IPC-based window controls:
    - `close-window` → `BrowserWindow.fromWebContents(sender).close()`
    - `minimize-window` → `.minimize()`
    - `maximize-window` → `.isMaximized() ? .unmaximize() : .maximize()`
    - `drag-window` → `win.startDragging()` (ow-electron) or track mouse movement

**Overlay widget wrappers (~20 files in `libs/legacy/feature-shell/src/lib/js/components/overlays/`):**

- [ ] **P6.2.4** These use `OverwolfService` for window info (game dimensions, position). Many of them extend `AbstractWidgetWrapperComponent` which likely handles the OW abstraction. Check if the base class already handles Electron. If not, update the base class to use `ElectronGameWindowService` when in Electron context.

---

## Phase 7 — Polish & Verification

---

### 7.1 IndexedDB Migration Check

- [ ] **P7.1.1** Search for `IndexedDB` or `indexedDB` usage in settings-related components. File flagged: the settings root component. Verify whether it uses IndexedDB directly or via `IDatabaseService`. If via the token, it should use `SqliteDatabaseService` in Electron automatically. If direct, add a branch.

---

### 7.2 Input Tracking

- [ ] **P7.2.1** Check if ow-electron provides game input events (mouse/keyboard in-game). Look at ow-electron documentation or the overlay API events.
- [ ] **P7.2.2** If not available, evaluate `uiohook-napi` for global input hooks. Be cautious of anti-cheat concerns.
- [ ] **P7.2.3** Wire input events to the pack-monitor service (`pack-monitor.service.ts` calls `ow.addMouseUpListener()`).

---

### 7.3 Lazy Service Instantiation

- [ ] **P7.3.1** Refactor `electron-app-injector-setup.ts` to use lazy initialization:
    - Convert `ElectronAngularInjector.register()` to accept factory functions instead of instances
    - Only instantiate services when first requested via `get()`
    - This is a significant refactor — defer unless startup performance is a problem

---

### 7.4 `DeckParserService` null OverwolfService Fix

- [ ] **P7.4.1** In `electron-app-injector-setup.ts` line 272, `DeckParserService` receives `null` for the `OverwolfService` parameter. Read `DeckParserService` to see what OW methods it calls. If it only uses `OverwolfService.getLocalAppDataFolder()`, replace with `app.getPath('userData')` or equivalent via a small adapter.

---

### 7.5 Installer & Distribution

- [ ] **P7.5.1** **Code signing** — Obtain a code signing certificate and configure in `electron-builder.yml`:

    ```yaml
    win:
        certificateFile: path/to/cert.pfx
        certificatePassword: ${WIN_CSC_KEY_PASSWORD}
    ```

- [ ] **P7.5.2** **Custom NSIS installer** — Customize the NSIS installer:
    - Custom installer graphics (header, sidebar images)
    - Install directory selection
    - Desktop shortcut option
    - First-run behavior (launch app after install)
    - Configure in `electron-builder.yml` under `nsis:` section

- [ ] **P7.5.3** **Uninstall survey** — Add an NSIS uninstall callback that opens a survey URL in the browser (like OW's `uninstall.html`):
    ```nsis
    !macro customUnInstall
      ExecShell "open" "https://firestoneapp.com/uninstall-survey"
    !macroend
    ```
    Place in a custom NSIS include file referenced by `electron-builder.yml`'s `nsis.include` option.

---

### 7.6 Twitch Integration Verification

- [ ] **P7.6.1** With API auth working (P1.3), verify that Twitch extension data broadcasting works:
    - The Twitch EBS receives game state via API calls
    - Check if `libs/twitch/` services use `ApiRunner` (which has an Electron implementation) or `OverwolfService`
    - If they use `ApiRunner`, they should work. If they use OW APIs, they need updating.

- [ ] **P7.6.2** Verify Twitch settings in the Settings window — the `settings-broadcast.ts` component uses `OverwolfService.openUrlInDefaultBrowser()`. This is handled by P1.2.2.

---

### 7.7 Analytics Verification

- [ ] **P7.7.1** Read `analytics.service.ts` to understand how Plausible is initialized. If it uses `ow.getMainWindow()['plausibleInstance']`, this won't work in Electron. Create a Plausible instance in the Electron main process or each renderer window.

- [ ] **P7.7.2** Verify events are sent by checking network traffic or Plausible dashboard after running the Electron app.

---

### 7.8 Mod System Verification

- [ ] **P7.8.1** After P1.1.5 and P1.1.6 are done (`downloadFileTo`, `downloadAndUnzipFile`), verify mod installation works:
    - Go to Settings > Mods
    - Try enabling a mod (e.g., in-game replay)
    - Verify the mod files are downloaded and extracted correctly
    - Verify the mod loads and functions in-game

---

### 7.9 End-to-End Overlay Testing

- [ ] **P7.9.1** Launch Hearthstone with the Electron app running. Verify each overlay renders:
    - [ ] Decktracker (player deck)
    - [ ] Decktracker (opponent deck)
    - [ ] Secrets helper
    - [ ] Turn timer
    - [ ] Game counters (various)
    - [ ] Battlegrounds: board, leaderboard, hero selection, quest selection, trinket selection
    - [ ] Battlegrounds: battle simulation, banned tribes, session widget
    - [ ] Arena: hero selection, card selection (draft), mulligan
    - [ ] Lottery widget
    - [ ] Constructed: mulligan hand, card choice
    - [ ] Mercenaries: team overlay (if applicable)

- [ ] **P7.9.2** Verify overlay interactions:
    - Dragging widgets to new positions
    - Clicking interactive elements (buttons, dropdowns)
    - Click-through on non-widget areas
    - Overlay resizes correctly when game resolution changes
    - Overlay appears/disappears with game focus changes

---

## Appendix: File Reference

### Key Electron App Files

| File                                                                     | Purpose                              |
| ------------------------------------------------------------------------ | ------------------------------------ |
| `apps/electron-app/src/main.ts`                                          | Main process entry point             |
| `apps/electron-app/src/app/app.ts`                                       | App bootstrap, protocol handler, IPC |
| `apps/electron-app/src/app/main.preload.ts`                              | Preload script for renderer          |
| `apps/electron-app/src/app/services/electron-app-injector-setup.ts`      | DI container setup                   |
| `apps/electron-app/src/app/services/overlay.service.ts`                  | ow-electron overlay management       |
| `apps/electron-app/src/app/services/electron-window-handler.service.ts`  | Window creation/management           |
| `apps/electron-app/src/app/services/electron-hotkey-handler.service.ts`  | Hotkey stubs                         |
| `apps/electron-app/src/app/services/low-level-utils-electron.service.ts` | File/notification/capture stubs      |
| `apps/electron-app/src/app/services/system-tray.ts`                      | System tray                          |
| `apps/electron-app/src/app/services/mind-vision-electron.service.ts`     | Memory reading                       |
| `apps/electron-app/src/app/services/game-events-electron.service.ts`     | Game events                          |
| `apps/electron-app/src/app/services/sqlite-database.service.ts`          | SQLite storage                       |

### Key Electron Frontend Files

| File                                                                       | Purpose                     |
| -------------------------------------------------------------------------- | --------------------------- |
| `apps/electron-frontend/src/main.ts`                                       | Angular bootstrap           |
| `apps/electron-frontend/src/app/app.routes.ts`                             | Routes: /overlay, /settings |
| `apps/electron-frontend/src/app/overlay/electron-overlay.component.ts`     | Full-screen overlay host    |
| `apps/electron-frontend/src/app/overlay/electron-settings.component.ts`    | Settings window host        |
| `apps/electron-frontend/src/app/overlay/electron-entry-point.component.ts` | Base class for entry points |

### Key Shared Electron Libs

| File                                                            | Purpose                   |
| --------------------------------------------------------------- | ------------------------- |
| `libs/electron/common/src/lib/electron-api-runner.service.ts`   | HTTP client (auth TODO)   |
| `libs/electron/common/src/lib/electron-game-window.service.ts`  | Game window info tracking |
| `libs/electron/common/src/lib/electron-storage.service.ts`      | Local storage replacement |
| `libs/electron/common/src/lib/standalone-user.service.ts`       | Auth/user service         |
| `libs/electron/common/src/lib/electron-subscription.service.ts` | Subscription service      |

### Key Platform Abstraction Files

| File                                                                      | Purpose                                  |
| ------------------------------------------------------------------------- | ---------------------------------------- |
| `libs/shared/framework/core/src/lib/services/overwolf.service.ts`         | OW API wrapper (needs Electron branches) |
| `libs/shared/framework/core/src/lib/services/window-handler.interface.ts` | Window handler interface                 |
| `libs/shared/framework/core/src/lib/services/hotkey-handler.interface.ts` | Hotkey handler interface                 |
| `libs/shared/framework/core/src/lib/services/abstract-facade-service.ts`  | Main/renderer IPC facade                 |
| `libs/shared/framework/core/src/lib/services/electron-utils.ts`           | `isElectronContext()`, `isMainProcess()` |
| `libs/shared/framework/core/src/lib/services/ow-utils.service.ts`         | Low-level utils interface                |
