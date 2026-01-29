import { InjectionToken } from '@angular/core';

/**
 * Token for injecting the window handler implementation (OW or Electron).
 * The implementation is the single place responsible for managing windows.
 */
export const WINDOW_HANDLER_SERVICE_TOKEN = new InjectionToken<IWindowHandlerService>('WindowHandlerService');

/**
 * Abstraction for window management. Implementations are provided by
 * ow-native (Overwolf) or electron-app (Electron) so the rest of the app
 * can work with either platform.
 */
export interface IWindowHandlerService {
	toggleBattlegroundsWindow(useOverlay: boolean, options?: IBattlegroundsWindowOptions);
	openSettingsWindow(userOverlay: boolean): void | Promise<void>;
}

export interface IBattlegroundsWindowOptions {
	forced?: 'open' | 'closed' | null;
	canBringUpFromMinimized?: boolean;
}
