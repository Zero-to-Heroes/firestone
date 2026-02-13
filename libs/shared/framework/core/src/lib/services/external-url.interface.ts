import { InjectionToken } from '@angular/core';

/**
 * Token for injecting the external URL service implementation (OW or Electron).
 * Used to open URLs in the system default browser.
 */
export const EXTERNAL_URL_SERVICE_TOKEN = new InjectionToken<IExternalUrlService>('ExternalUrlService');

/**
 * Abstraction for opening URLs in the default browser. Implementations are provided by
 * OverwolfService (Overwolf) or ElectronExternalUrlService (Electron) so the rest of the app
 * can work with either platform.
 */
export interface IExternalUrlService {
	openUrlInDefaultBrowser(url: string): void;
}
