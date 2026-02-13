import { IExternalUrlService } from '@firestone/shared/framework/core';
import { shell } from 'electron';

/**
 * Electron implementation of opening URLs in the default browser.
 * Uses shell.openExternal which is only available in the main process.
 */
export class ElectronExternalUrlService implements IExternalUrlService {
	public openUrlInDefaultBrowser(url: string): void {
		shell.openExternal(url);
	}
}
