# Main Window Store Migration Plan

**Goal:** Migrate `MainWindowStoreService` from `libs/legacy/feature-shell` to `libs/mainwindow/common`.

**Critical constraint:** `mainwindow/common` must have **no UI element or renderer dependencies** — it will be used in a Node.js context (e.g., Electron main process) later.

---

## 1. Current State Analysis

### 1.1 What Is Being Migrated


| Item                | Location                                                        | Count |
| ------------------- | --------------------------------------------------------------- | ----- |
| Main service        | `main-window-store.service.ts`                                  | 1     |
| Events              | `store/events/**/*.ts`                                          | ~55   |
| Processors          | `store/processors/**/*.ts`                                      | ~55   |
| Supporting services | `store-bootstrap.service.ts`, `collection-bootstrap.service.ts` | 2     |
| Processor base      | `processor.ts`                                                  | 1     |


**Total:** ~115 files in the store subtree.

### 1.2 External Package Dependencies (main-window-store.service.ts)


| Package                            | Usage                                                                                                                                    | Node.js Safe?                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `@angular/core`                    | `Inject`, `Injectable`, `NgZone`                                                                                                         | ⚠️ NgZone is Angular change-detection; optional in ProcessingQueue |
| `@ngx-translate/core`              | `TranslateService`                                                                                                                       | ❌ UI/renderer (DOM)                                                |
| `@firestone/shared/framework/core` | `ProcessingQueue`, `waitForReady`, `CardsFacadeService`, `ILocalizationService`, `IWindowHandlerService`, `WINDOW_HANDLER_SERVICE_TOKEN` | ⚠️ Mixed — see below                                               |
| `immutable`                        | `Map`                                                                                                                                    | ✅                                                                  |
| `rxjs`                             | `BehaviorSubject`, `filter`                                                                                                              | ✅                                                                  |


### 1.3 Feature-Shell Internal Dependencies (relative imports)

These are **not** in published packages and live inside `legacy/feature-shell`:


| Service                      | Path                                      | Purpose                 |
| ---------------------------- | ----------------------------------------- | ----------------------- |
| `PackStatsService`           | `libs/packs/services/pack-stats.service`  | Pack statistics         |
| `BgsPerfectGamesService`     | `battlegrounds/bgs-perfect-games.service` | BG perfect games        |
| `BgsRunStatsService`         | `battlegrounds/bgs-run-stats.service`     | BG run stats            |
| `CollectionManager`          | `collection/collection-manager.service`   | Collection data         |
| `SetsManagerService`         | `collection/sets-manager.service`         | Card sets               |
| `SetsService`                | `collection/sets-service.service`         | Card sets               |
| `DecksProviderService`       | `decktracker/main/decks-provider.service` | Deck data               |
| `CollectionBootstrapService` | `store/collection-bootstrap.service`      | Collection bootstrap    |
| `StoreBootstrapService`      | `store/store-bootstrap.service`           | Initial state bootstrap |


### 1.4 Published Package Dependencies (from main-window-store.service.ts)


| Package                               | Usage                                                                                                                                                          |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@firestone/achievements/common`      | AchievementHistoryService, AchievementsMemoryMonitor, AchievementsNavigationService, AchievementsStateManagerService, FirestoneRemoteAchievementsLoaderService |
| `@firestone/achievements/data-access` | AchievementsRefLoaderService                                                                                                                                   |
| `@firestone/arena/common`             | ArenaNavigationService                                                                                                                                         |
| `@firestone/battlegrounds/services`   | BattlegroundsNavigationService                                                                                                                                 |
| `@firestone/battlegrounds/simulator`  | BgsSimulatorControllerService                                                                                                                                  |
| `@firestone/collection/common`        | CollectionNavigationService                                                                                                                                    |
| `@firestone/constructed/common`       | ConstructedNavigationService, ConstructedPersonalDecksService                                                                                                  |
| `@firestone/mainwindow/common`        | IMainWindowStoreService, MainWindowNavigationService, MainWindowState, MainWindowStoreEvent, NavigationState                                                   |
| `@firestone/shared/common/service`    | AppNavigationService, Events, PreferencesService                                                                                                               |
| `@firestone/shared/framework/core`    | CardsFacadeService, ILocalizationService, IWindowHandlerService, ProcessingQueue, waitForReady, WINDOW_HANDLER_SERVICE_TOKEN                                   |
| `@firestone/stats/data-access`        | GameStatsLoaderService                                                                                                                                         |


### 1.5 UI / Renderer Dependencies (Blockers for Node.js)


| Dependency                    | Used By                                                       | Issue                                                                 |
| ----------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------- |
| **TranslateService**          | `LocalizationUpdateProcessor`                                 | `translate.use(locale).toPromise()` — ngx-translate, DOM-bound        |
| **NgZone**                    | `MainWindowStoreService` → `ProcessingQueue`                  | Angular zone; optional (can pass `undefined`)                         |
| **IWindowHandlerService**     | `BattlegroundsMainWindowSelectBattleProcessor`                | `showCollectionWindow()` — Electron/Overwolf window APIs              |
| **LocalizationFacadeService** | `StoreBootstrapService`                                       | Wraps TranslateService; uses `translateString()` for UI labels        |
| **ILocalizationService**      | Many processors                                               | Interface; impl often uses TranslateService                           |
| **CardsFacadeService**        | Several processors                                            | May pull in card images/DOM; needs verification                       |
| **WindowManagerService**      | `MainWindowStateFacadeService` (already in mainwindow/common) | Electron/Overwolf; `AbstractFacadeService` uses `require('electron')` |
| **SafeHtml**                  | `mainwindow/common` model (`sharing-achievement.ts`)          | `@angular/platform-browser` — DOM type                                |


---

## 2. mainwindow/common Current Dependencies

From `mainwindow-common.module.ts` and package imports:

- `CommonModule`, `NgModule` (Angular)
- `AchievementsCommonModule`
- `BattlegroundsServicesModule`
- `GameStateModule`
- `SharedFrameworkCommonModule`
- `SharedFrameworkCoreModule`
- `StatsDataAccessModule`

**Existing Node.js blockers in mainwindow/common:**

- `MainWindowStateFacadeService` → `WindowManagerService`, `AbstractFacadeService` (Electron)
- `sharing-achievement.ts` → `SafeHtml` from `@angular/platform-browser`
- `achievements-state.ts` → `ILocalizationService` (used in `retrieveAllAchievements`)

---

## 3. Dependency Graph (Simplified)

```
MainWindowStoreService
├── ProcessingQueue (NgZone optional)
├── StoreBootstrapService
│   └── LocalizationFacadeService (TranslateService) ❌
├── CollectionBootstrapService
│   ├── WindowManagerService ❌
│   ├── AbstractFacadeService ❌
│   ├── MemoryUpdatesService
│   └── CollectionManager
├── 55+ Processors
│   ├── LocalizationUpdateProcessor → TranslateService ❌
│   ├── BattlegroundsMainWindowSelectBattleProcessor → IWindowHandlerService ❌
│   └── Many → ILocalizationService (translateString) ⚠️
├── Feature-shell internals (CollectionManager, DecksProvider, etc.)
└── Navigation services, PreferencesService, etc.
```

---

## 4. Flagged Issues

### 4.1 Prior Refactors Required

1. **Extract feature-shell internals to proper libs**
  - `PackStatsService`, `CollectionManager`, `SetsManagerService`, `SetsService`, `DecksProviderService`, `BgsRunStatsService`, `BgsPerfectGamesService` are all inside feature-shell.
  - **Action:** Move to `@firestone/packs`, `@firestone/collection/data-access`, `@firestone/decktracker/data-access`, `@firestone/battlegrounds/data-access`, etc., or equivalent shared libs.
  - Without this, mainwindow/common would depend on feature-shell, creating a circular or inverted dependency.
2. **Localization abstraction**
  - `ILocalizationService` and `LocalizationFacadeService` are tied to `TranslateService`.
  - For Node.js, a **headless localization** interface is needed: e.g. `translateString(key, params) => string` without DOM/ngx-translate.
  - **Action:** Introduce `ILocalizationProvider` (or similar) in shared/framework/core with:
    - Renderer impl: delegates to TranslateService
    - Node impl: uses static JSON/ICU or a simple lookup
3. **StoreBootstrapService and localization**
  - `buildInitialStore()` uses `this.i18n.translateString()` for category names (arena, stats).
  - **Action:** Either:
    - Pass pre-translated strings from the shell, or
    - Use locale keys in state and resolve at render time, or
    - Inject a Node-safe `ILocalizationProvider`.
4. **Window handler abstraction**
  - `IWindowHandlerService.showCollectionWindow()` is used by `BattlegroundsMainWindowSelectBattleProcessor`.
  - **Action:** Make this processor (or its side effects) optional:
    - Inject `IWindowHandlerService` as optional, or
    - Move “show window” behavior to a separate, shell-only handler that the store does not depend on.
5. **ProcessingQueue and NgZone**
  - `ProcessingQueue` accepts `NgZone` as optional; when `undefined`, it runs without zone.
  - **Action:** In Node.js context, pass `undefined` for NgZone. No code change needed if DI is set up correctly.

### 4.2 Architectural Issues

1. **Monolithic store**
  - One service, ~55 processors, many feature-specific dependencies.
  - **Risk:** Moving as-is would make mainwindow/common depend on almost every feature (achievements, arena, battlegrounds, collection, constructed, mercenaries, stats, etc.).
  - **Suggestion:** Consider a **plugin/registry** model where processors are registered by feature modules instead of hard-coded in the store.
2. **MainWindowStateFacadeService**
  - Already in mainwindow/common; uses `WindowManagerService` and `AbstractFacadeService`.
  - **Conflict:** This is Electron/renderer-specific, contradicting the “no UI/renderer” rule.
  - **Action:** Move `MainWindowStateFacadeService` to a shell/electron-specific lib (e.g. `mainwindow/shell` or `mainwindow/electron`), or split mainwindow/common into:
    - `mainwindow/common` (Node-safe: models, interfaces, events)
    - `mainwindow/shell` (Electron/renderer: facade, window integration)
3. **SafeHtml in models**
  - `SharingAchievement` uses `SafeHtml` from `@angular/platform-browser`.
  - **Action:** Replace with `string` or a neutral type for Node.js compatibility.

### 4.3 Module Dependency Issues

If mainwindow/common gains the store:

- It would need: achievements, arena, battlegrounds, collection, constructed, stats, packs, decktracker, mercenaries, etc.
- `mainwindow/common` would become a hub with many dependencies.
- **Action:** Either:
  - Accept the hub role and add all deps, or
  - Split store into a core (events + processing loop) and feature-specific processor registration in each feature module.

---

## 5. Recommended Migration Strategy

### Phase 0: Pre-Migration Refactors (Required First)


| #   | Task                                                                                                                                  | Effort | Blocks           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------- |
| 0.1 | Extract `PackStatsService`, `CollectionManager`, `SetsManagerService`, `SetsService` to `@firestone/collection` or `@firestone/packs` | High   | Store migration  |
| 0.2 | Extract `DecksProviderService` to `@firestone/decktracker/data-access`                                                                | Medium | Store migration  |
| 0.3 | Extract `BgsRunStatsService`, `BgsPerfectGamesService` to `@firestone/battlegrounds/data-access`                                      | Medium | Store migration  |
| 0.4 | Introduce `ILocalizationProvider` (Node-safe) and refactor `StoreBootstrapService` + processors to use it                             | Medium | Node.js use      |
| 0.5 | Make `IWindowHandlerService` optional in `BattlegroundsMainWindowSelectBattleProcessor` or move window logic out of store             | Low    | Node.js use      |
| 0.6 | Replace `SafeHtml` with `string` in `SharingAchievement`                                                                              | Low    | Node.js use      |
| 0.7 | Move `MainWindowStateFacadeService` to a shell-specific lib                                                                           | Medium | Clean separation |


### Phase 1: Move Events and Processor Contract

1. Move all **events** (`store/events/`**) to `mainwindow/common` (or a new `mainwindow/store-events` lib).
2. Move **Processor** base interface and `MainWindowStoreEvent` contract to mainwindow/common.
3. Events are pure data; no UI deps. ✅

### Phase 2: Move Processors (With Abstraction)

1. Move processors to mainwindow/common **or** keep them in feature libs and register via a registry.
2. Refactor processors to depend on:
  - `ILocalizationProvider` instead of `TranslateService` / `LocalizationFacadeService`
  - Optional `IWindowHandlerService` where needed
3. Ensure no direct DOM/Electron/TranslateService usage.

### Phase 3: Move Store Core

1. Move `MainWindowStoreService` to mainwindow/common.
2. Move `StoreBootstrapService` and `CollectionBootstrapService` (after refactoring localization).
3. Use constructor injection for all services; ensure Node.js build does not pull in:
  - `@ngx-translate/core`
  - `WindowManagerService` / `AbstractFacadeService`
  - `IWindowHandlerService` (or provide a no-op impl for Node).

### Phase 4: Wire-Up in feature-shell

1. feature-shell imports `MainWindowStoreService` from `@firestone/mainwindow/common`.
2. feature-shell provides all concrete implementations (localization, window handler, etc.).
3. Remove store implementation from feature-shell.

### Phase 5: Node.js Compatibility Check

1. Build mainwindow/common for Node (or ensure no renderer imports).
2. Verify no `@angular/platform-browser`, `@ngx-translate`, `require('electron')`, or `window` in the dependency tree.

---

## 6. Alternative: Lighter Migration

If full migration is too costly:

1. **Keep store in feature-shell**, but:
  - Move **events** and **processor interface** to mainwindow/common.
  - Have mainwindow/common define `IMainWindowStoreService` and the event contract.
  - feature-shell provides the concrete `MainWindowStoreService` implementation.
2. **Create a separate `MainWindowStoreNodeService`** in mainwindow/common:
  - Simplified state machine for Node.js (e.g., main process).
  - Handles only a subset of events (e.g., preferences, navigation state).
  - No UI, no window handler, no TranslateService.
3. Both implementations implement `IMainWindowStoreService`; the shell uses the full one, Node uses the reduced one.

---

## 7. Summary Checklist

- Extract feature-shell services (collection, packs, decktracker, battlegrounds) to proper libs
- Introduce Node-safe localization (`ILocalizationProvider`)
- Make `IWindowHandlerService` optional or move window logic out of store
- Replace `SafeHtml` with `string` in mainwindow/common models
- Move `MainWindowStateFacadeService` to shell-specific lib
- Move events to mainwindow/common
- Refactor processors to use abstractions (no TranslateService, optional window handler)
- Move store service + bootstrap services to mainwindow/common
- Update feature-shell to consume from mainwindow/common
- Verify mainwindow/common has no UI/renderer deps for Node.js use

---

## 8. Files to Migrate (Reference)

```
libs/legacy/feature-shell/src/lib/js/services/mainwindow/store/
├── main-window-store.service.ts      → mainwindow/common
├── store-bootstrap.service.ts        → mainwindow/common (after localization refactor)
├── collection-bootstrap.service.ts   → mainwindow/common (after collection lib extraction)
├── processor.ts                     → mainwindow/common
├── events/                          → mainwindow/common (all ~55 events)
└── processors/                     → mainwindow/common or feature libs (~55 processors)
```

