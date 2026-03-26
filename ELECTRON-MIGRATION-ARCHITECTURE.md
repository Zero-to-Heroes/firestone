# Electron Migration — Dedicated Services Architecture

> This document describes the recommended architecture for Electron platform abstractions, using dedicated services with the facade pattern instead of bundling Electron fallbacks inside OverwolfService.

## Pattern: Interface + Token + Implementations

For each platform capability, use this structure:

```
libs/shared/framework/core/
  └── interfaces/
      └── i-<capability>.interface.ts    # Interface + InjectionToken

Overwolf (ow-native / legacy):
  └── Ow<Capability>Service              # Implements interface, uses Overwolf APIs

Electron (electron-app):
  └── Electron<Capability>Service        # Main process: implements interface, uses Electron/Node APIs
  └── Electron<Capability>FacadeService  # Extends AbstractFacadeService, proxies to main via IPC
```

## Benefits

1. **Isolation of concerns** — Services are grouped by capability (clipboard, URL, monitors, etc.)
2. **Single interface** — Components inject `IClipboardService` (or token), not `OverwolfService`
3. **Clear separation** — OW vs Electron vs main vs renderer are explicit, not mixed in one class

## Reference Implementation: Hotkey Handler

| Layer | File | Role |
|-------|------|------|
| Interface | `hotkey-handler.interface.ts` | `IHotkeyHandlerService`, `HOTKEY_HANDLER_SERVICE_TOKEN` |
| OW impl | `ow-hotkey-handler.service.ts` | Uses `overwolf.settings.hotkeys` |
| Electron main | `electron-hotkey-handler.service.ts` | Uses `globalShortcut` (when implemented) |
| Electron facade | `electron-hotkey-handler-facade.service.ts` | Extends `AbstractFacadeService`, uses `callOnMainProcess` |

## Services to Extract (from OverwolfService)

Based on Phase 1.2 work, these should become dedicated services:

| Capability | Interface | OW Implementation | Electron Main | Electron Facade |
|------------|------------|--------------------|---------------|-----------------|
| **External URL** | `IExternalUrlService` ✅ | `OverwolfService` (useExisting) | `ElectronExternalUrlService` ✅ | N/A (renderer uses `ElectronExternalUrlRendererService` + electronAPI) |
| **Clipboard** | `IClipboardService` ✅ | `OverwolfService` (useExisting) | N/A (facade registers handlers) | `ElectronClipboardFacadeService` ✅ |
| **Monitors** | `IMonitorsService` | `OwMonitorsService` | `ElectronMonitorsService` | `ElectronMonitorsFacadeService` |
| **System info** | `ISystemInfoService` | `OwSystemInfoService` | `ElectronSystemInfoService` | `ElectronSystemInfoFacadeService` |
| **File system UI** (explorer + file picker) | `IFileSystemUIService` | `OverwolfService` (useExisting) | N/A (facade registers handlers) | `ElectronFileSystemUIFacadeService` |
| **Region** | `IRegionInfoService` | `OwRegionInfoService` | `ElectronRegionInfoService` | `ElectronRegionInfoFacadeService` |

### Clipboard (implemented)

- **Interface:** `libs/shared/framework/core/src/lib/services/clipboard-service.interface.ts`
- **OW:** `OverwolfService` implements `IClipboardService`; `CLIPBOARD_SERVICE_TOKEN` → `useExisting: OverwolfService`
- **Electron:** `ElectronClipboardFacadeService` in `libs/electron/view`; uses `registerMainProcessMethod` for IPC
- **Components updated:** `copy-deckstring.component.ts`, `import-deckstring.component.ts`
- **Remaining:** ~10 components still use `this.ow.placeOnClipboard` / `getFromClipboard`; can be migrated incrementally

## Facade Pattern (AbstractFacadeService)

For Electron services that must run in the main process (clipboard, dialog, screen, shell):

1. **Main process**: Real implementation uses Electron/Node APIs directly
2. **Renderer process**: Facade uses `callOnMainProcess(methodName, ...args)` → IPC → main
3. **Registration**: `registerMainProcessMethod(methodName, handler)` in `initElectronMainProcess()`

```typescript
// ElectronClipboardFacadeService
protected override async initElectronMainProcess() {
  this.registerMainProcessMethod('placeOnClipboard', (text: string) => {
    clipboard.writeText(text);
  });
  this.registerMainProcessMethod('getFromClipboard', () => clipboard.readText());
}

public async placeOnClipboard(text: string): Promise<void> {
  await this.callOnMainProcess('placeOnClipboard', text);
}
public async getFromClipboard(): Promise<string> {
  return this.callOnMainProcess('getFromClipboard');
}
```

## Migration Path

1. **Create interfaces** in `libs/shared/framework/core`
2. **Create Electron services** (main + facade) in `apps/electron-app`
3. **Create OW implementations** (or extract from OverwolfService)
4. **Update components** to inject tokens instead of OverwolfService
5. **Remove Electron branches** from OverwolfService
6. **Remove IPC handlers** from `app.ts` that are replaced by facade `registerMainProcessMethod`

## Notes

- **External URL** already follows this pattern: `IExternalUrlService`, `ElectronExternalUrlService` (main), `ElectronExternalUrlRendererService` (renderer, uses electronAPI). The renderer uses electronAPI directly because it's simpler than a facade for a single method.
- **Facade vs direct electronAPI**: For services with many methods or complex state, use the facade. For single-method services, electronAPI in preload may be sufficient.
- **OverwolfService** will eventually become a thin OW-only service; platform-agnostic code moves to dedicated services.
