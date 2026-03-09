import { InjectionToken } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Token for injecting the hotkey handler implementation (OW or Electron).
 * Responsible for listening to global hotkeys. Implementations may depend
 * on the window handler (e.g. for context like current window).
 */
export const HOTKEY_HANDLER_SERVICE_TOKEN = new InjectionToken<IHotkeyHandlerService>('HotkeyHandlerService');

/**
 * Token for the Electron main-process hotkey handler implementation.
 * Used by ElectronHotkeyHandlerFacadeService to resolve the handler in main process.
 * electron-app registers ElectronHotkeyHandlerService with this token.
 */
export const ELECTRON_HOTKEY_HANDLER_IMPL_TOKEN = new InjectionToken<IHotkeyHandlerService>(
	'ElectronHotkeyHandlerImpl',
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
	isReady(): Promise<void>;
	liveInfoKeyPressed$$: BehaviorSubject<boolean>;

	addHotKeyHoldListener(hotkey: string, onDown: () => void, onUp: () => void): HotkeyHoldUnsubscribe;
	removeHotKeyHoldListener(listener: HotkeyHoldUnsubscribe): void;
	addHotKeyPressedListener(hotkey: string, callback: () => void): void;
	// removeHotKeyPressedListener(listener: (message: any) => void): void;
	addHotkeyChangedListener(callback: (message: any) => void): HotkeyChangedUnsubscribe;
	removeHotkeyChangedListener(listener: HotkeyChangedUnsubscribe): void;

	/** Returns the binding string for a hotkey (e.g. "Alt+C") or null if unassigned. Works in both Electron and Overwolf. */
	getHotkeyBinding(hotkeyName: string): Promise<string | null>;
}
