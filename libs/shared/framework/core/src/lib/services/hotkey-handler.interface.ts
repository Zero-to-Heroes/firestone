import { InjectionToken } from '@angular/core';

/**
 * Token for injecting the hotkey handler implementation (OW or Electron).
 * Responsible for listening to global hotkeys. Implementations may depend
 * on the window handler (e.g. for context like current window).
 */
export const HOTKEY_HANDLER_SERVICE_TOKEN = new InjectionToken<IHotkeyHandlerService>(
	'HotkeyHandlerService'
);

/** Unsubscribe function for hotkey hold listener */
export type HotkeyHoldUnsubscribe = (message?: unknown) => void;

/** Unsubscribe function for hotkey changed listener */
export type HotkeyChangedUnsubscribe = (message?: unknown) => void;

/**
 * Abstraction for global hotkey handling. Implementations are provided by
 * ow-native (Overwolf) or electron-app (Electron).
 */
export interface IHotkeyHandlerService {
}
