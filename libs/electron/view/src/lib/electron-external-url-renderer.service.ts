import { Injectable } from '@angular/core';
import { IExternalUrlService } from '@firestone/shared/framework/core';

declare global {
	interface Window {
		electronAPI?: {
			openUrlInDefaultBrowser?: (url: string) => Promise<void>;
		};
	}
}

/**
 * Renderer-process implementation of IExternalUrlService.
 * Uses IPC via electronAPI to open URLs in the default browser (main process).
 * No Overwolf dependency — safe for use in Electron renderer and web contexts.
 */
@Injectable({ providedIn: 'root' })
export class ElectronExternalUrlRendererService implements IExternalUrlService {
	public openUrlInDefaultBrowser(url: string): void {
		if (window.electronAPI?.openUrlInDefaultBrowser) {
			window.electronAPI.openUrlInDefaultBrowser(url);
		} else {
			window.open(url, '_blank');
		}
	}
}
