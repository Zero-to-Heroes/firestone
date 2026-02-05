import { InjectionToken } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Token for injecting the hotkey handler implementation (OW or Electron).
 * Responsible for listening to global hotkeys. Implementations may depend
 * on the window handler (e.g. for context like current window).
 */
export const HOTKEY_HANDLER_SERVICE_TOKEN = new InjectionToken<IHotkeyHandlerService>('HotkeyHandlerService');

/** Unsubscribe function for hotkey hold listener */
export type HotkeyHoldUnsubscribe = (message?: unknown) => void;

/** Unsubscribe function for hotkey changed listener */
export type HotkeyChangedUnsubscribe = (message?: unknown) => void;

/**
 * Abstraction for global hotkey handling. Implementations are provided by
 * ow-native (Overwolf) or electron-app (Electron).
 */
export interface IHotkeyHandlerService {
	liveInfoKeyPressed$$: BehaviorSubject<boolean>;

	addHotKeyHoldListener(hotkey: string, onDown: () => void, onUp: () => void): HotkeyHoldUnsubscribe;
	removeHotKeyHoldListener(listener: HotkeyHoldUnsubscribe): void;
	addHotKeyPressedListener(hotkey: string, callback: () => void): void;
	// removeHotKeyPressedListener(listener: (message: any) => void): void;
	addHotkeyChangedListener(callback: (message: any) => void): HotkeyChangedUnsubscribe;
	removeHotkeyChangedListener(listener: HotkeyChangedUnsubscribe): void;
}
