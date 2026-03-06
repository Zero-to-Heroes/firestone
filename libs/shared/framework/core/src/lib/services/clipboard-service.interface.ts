import { InjectionToken } from '@angular/core';

/**
 * Token for injecting the clipboard service implementation (OW or Electron).
 */
export const CLIPBOARD_SERVICE_TOKEN = new InjectionToken<IClipboardService>('ClipboardService');

/**
 * Abstraction for clipboard operations. Implementations are provided by
 * OverwolfService (Overwolf) or ElectronClipboardFacadeService (Electron).
 */
export interface IClipboardService {
	placeOnClipboard(value: string): Promise<void>;
	getFromClipboard(): Promise<string>;
}
