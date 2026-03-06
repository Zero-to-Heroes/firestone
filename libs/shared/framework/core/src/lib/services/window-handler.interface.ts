import { InjectionToken } from '@angular/core';

/**
 * Token for injecting the window handler implementation (OW or Electron).
 * The implementation is the single place responsible for managing windows.
 */
export const WINDOW_HANDLER_SERVICE_TOKEN = new InjectionToken<IWindowHandlerService>('WindowHandlerService');

/**
 * Abstraction for app-level window orchestration. Implementations are provided by
 * ow-native (Overwolf) or electron-app (Electron). Handles which windows to show/hide
 * (collection, settings, battlegrounds), reload, relaunch. For per-window chrome
 * (minimize, maximize, close buttons), see IWindowControlsService.
 */
export interface IWindowHandlerService {
	toggleBattlegroundsWindow(useOverlay: boolean, options?: IWindowOptions);
	toggleCollectionWindow(useOverlay: boolean): void | Promise<void>;
	showCollectionWindow(useOverlay: boolean): void | Promise<void>;
	openSettingsWindow(userOverlay: boolean): void | Promise<void>;
	reloadWindows(): void | Promise<void>;
	relaunchApp(): void | Promise<void>;
}

export interface IWindowOptions {
	forced?: 'open' | 'closed' | null;
	canBringUpFromMinimized?: boolean;
}
