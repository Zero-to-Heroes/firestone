import { InjectionToken } from '@angular/core';

/**
 * Token for injecting the screenshot service implementation (OW or Electron).
 */
export const SCREENSHOT_SERVICE_TOKEN = new InjectionToken<IScreenshotService>('ScreenshotService');

/**
 * Abstraction for capturing window screenshots. Implementations delegate to
 * OwUtilsService (Overwolf) or use Electron/browser APIs.
 */
export interface IScreenshotService {
	/**
	 * Capture a window by name.
	 * @param windowName Display name of the window (e.g. 'Firestone - Main')
	 * @param copyToClipboard Whether to also copy the image to clipboard
	 * @returns [file path or null, raw byte array or null]
	 */
	captureWindow(windowName: string, copyToClipboard?: boolean): Promise<[string | null, unknown]>;
}
