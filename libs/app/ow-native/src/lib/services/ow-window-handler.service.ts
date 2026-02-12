import { Injectable } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { IWindowHandlerService, IWindowOptions, OverwolfService } from '@firestone/shared/framework/core';

/**
 * Overwolf implementation of window handling. Single place responsible for
 * managing windows when running in the Overwolf client.
 */
@Injectable({ providedIn: 'root' })
export class OwWindowHandlerService implements IWindowHandlerService {
	constructor(
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
	) {}

	public async openSettingsWindow() {
		const prefs = await this.prefs.getPreferences();
		const windowName = this.ow.getSettingsWindowName(prefs);
		const settingsWindow = await this.ow.obtainDeclaredWindow(windowName);
		await this.ow.restoreWindow(settingsWindow.id);
		this.ow.bringToFront(settingsWindow.id);
	}

	public async showCollectionWindow(useOverlay: boolean) {
		const windowName = useOverlay ? OverwolfService.COLLECTION_WINDOW_OVERLAY : OverwolfService.COLLECTION_WINDOW;
		const collectionWindow = await this.ow.obtainDeclaredWindow(windowName);
		await this.ow.restoreWindow(collectionWindow.id);
		this.ow.bringToFront(collectionWindow.id);
	}

	public async toggleCollectionWindow(useOverlay: boolean, options?: IWindowOptions) {
		const windowName = useOverlay ? OverwolfService.COLLECTION_WINDOW_OVERLAY : OverwolfService.COLLECTION_WINDOW;
		console.debug('[ow-window-handler] toggle Window', windowName, useOverlay, options);
		this.toggleWindow(windowName, useOverlay, options);
	}

	public async toggleBattlegroundsWindow(useOverlay: boolean, options?: IWindowOptions) {
		const windowName = useOverlay
			? OverwolfService.BATTLEGROUNDS_WINDOW_OVERLAY
			: OverwolfService.BATTLEGROUNDS_WINDOW;
		console.debug('[ow-window-handler] toggle Window', windowName, useOverlay, options);
		this.toggleWindow(windowName, useOverlay, options);
	}

	private async toggleWindow(windowName: string, useOverlay: boolean, options?: IWindowOptions) {
		const forcedStatus = options?.forced ?? null;
		const canBringUpFromMinimized = options?.canBringUpFromMinimized ?? true;

		const theWindow = await this.ow.getWindowState(windowName);
		console.debug('[ow-window-handler] window', windowName, theWindow);
		// Minimize is only triggered by a user action, so if they minimize it we don't touch it
		if (!canBringUpFromMinimized && theWindow.window_state_ex === 'minimized') {
			console.debug('[ow-window-handler] window is minimized, skipping', windowName);
			return;
		}

		if (forcedStatus === 'open') {
			console.debug('[ow-window-handler] forcedStatus is open, obtaining window', windowName);
			await this.ow.obtainDeclaredWindow(windowName);
			if (theWindow.window_state_ex !== 'maximized' && theWindow.stateEx !== 'maximized') {
				console.debug(
					'[ow-window-handler] window is not maximized, restoring and bringing to front',
					windowName,
				);
				await this.ow.restoreWindow(windowName);
				await this.ow.bringToFront(windowName);
			}
		} else if (forcedStatus === 'closed') {
			console.debug('[ow-window-handler] forcedStatus is closed, closing window', windowName);
			await this.ow.closeWindow(windowName);
		} else {
			// Toggle it - if it's open, close it, if it's closed, open it
			console.debug('[ow-window-handler] forcedStatus is null, toggling window', windowName);
			if (isWindowClosed(theWindow.window_state_ex) || isWindowHidden(theWindow.window_state_ex)) {
				console.debug(
					'[ow-window-handler] window is closed or hidden, restoring and bringing to front',
					windowName,
				);
				await this.ow.obtainDeclaredWindow(windowName);
				await this.ow.restoreWindow(windowName);
				await this.ow.bringToFront(windowName);
			} else {
				console.debug('[ow-window-handler] window is open, closing it', windowName);
				await this.ow.closeWindow(windowName);
			}
		}
	}

	public reloadWindows(): void {
		this.ow.getMainWindow().reloadWindows();
	}

	public relaunchApp(): void {
		this.ow.relaunchApp();
	}
}

const isWindowClosed = (state: string): boolean => {
	return state === 'closed' || state === 'hidden';
};

const isWindowHidden = (state: string): boolean => {
	return state !== 'normal' && state !== 'maximized';
};
