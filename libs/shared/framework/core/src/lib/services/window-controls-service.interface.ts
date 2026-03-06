import { InjectionToken } from '@angular/core';

/**
 * Token for injecting the window controls implementation (OW or Electron).
 *
 * Distinct from IWindowHandlerService: IWindowHandlerService handles app-level window
 * orchestration (toggle collection, show settings, reload, relaunch). IWindowControlsService
 * handles low-level chrome for the current window (minimize, maximize, close title bar buttons).
 */
export const WINDOW_CONTROLS_SERVICE_TOKEN = new InjectionToken<IWindowControlsService>('WindowControlsService');

/**
 * Minimal window info for cross-platform use.
 */
export interface IWindowInfo {
	id: string;
	name: string;
	stateEx?: string;
}

/**
 * Window state result for getWindowState.
 */
export interface IWindowStateResult {
	window_state_ex: string;
	[id: string]: unknown;
}

/**
 * Abstraction for window control operations. Implementations delegate to
 * OverwolfService (Overwolf) or use IPC (Electron).
 */
export interface IWindowControlsService {
	getCurrentWindow(): Promise<IWindowInfo>;
	minimizeWindow(windowId: string): Promise<void>;
	maximizeWindow(windowId: string): Promise<void>;
	restoreWindow(windowId: string): Promise<void>;
	closeWindow(windowId: string): Promise<void>;
	hideWindow(windowId: string): Promise<void>;
	addStateChangedListener(windowName: string, callback: (message: { window_state_ex?: string }) => void): (message: unknown) => void;
	removeStateChangedListener(listener: (message: unknown) => void): void;
	/** Whether a game is currently running (OW only; Electron returns false) */
	inGame(): Promise<boolean>;
	getWindowState(windowName: string): Promise<IWindowStateResult>;
	getOpenWindows(): Promise<Record<string, { id: string; [key: string]: unknown }>>;
	closeWindowFromName(windowName: string): Promise<void>;
	/** Whether this implementation can perform window operations (false in browser) */
	canControlWindow(): boolean;
}
