import { Injectable } from '@angular/core';
import { IBattlegroundsWindowOptions, IWindowHandlerService, OverwolfService } from '@firestone/shared/framework/core';

/**
 * Overwolf implementation of window handling. Single place responsible for
 * managing windows when running in the Overwolf client.
 */
@Injectable({ providedIn: 'root' })
export class OwWindowHandlerService implements IWindowHandlerService {
	constructor(private readonly ow: OverwolfService) { }

	public async toggleBattlegroundsWindow(useOverlay: boolean, options?: IBattlegroundsWindowOptions) {
		console.debug('[ow-window-handler] toggleBattlegroundsWindow', useOverlay, options);
		const forcedStatus = options?.forced ?? null;
		const canBringUpFromMinimized = options?.canBringUpFromMinimized ?? true;

		const windowName = useOverlay
			? OverwolfService.BATTLEGROUNDS_WINDOW_OVERLAY
			: OverwolfService.BATTLEGROUNDS_WINDOW;

		const battlegroundsWindow = await this.ow.getWindowState(windowName);
		console.debug('[ow-window-handler] battlegroundsWindow', battlegroundsWindow);
		// Minimize is only triggered by a user action, so if they minimize it we don't touch it
		if (!canBringUpFromMinimized && battlegroundsWindow.window_state_ex === 'minimized') {
			console.debug('[ow-window-handler] battlegroundsWindow is minimized, skipping');
			return;
		}

		if (forcedStatus === 'open') {
			console.debug('[ow-window-handler] forcedStatus is open, obtaining window');
			await this.ow.obtainDeclaredWindow(windowName);
			if (
				battlegroundsWindow.window_state_ex !== 'maximized' &&
				battlegroundsWindow.stateEx !== 'maximized'
			) {
				console.debug('[ow-window-handler] battlegroundsWindow is not maximized, restoring and bringing to front');
				await this.ow.restoreWindow(windowName);
				await this.ow.bringToFront(windowName);
			}
		} else if (forcedStatus === 'closed') {
			console.debug('[ow-window-handler] forcedStatus is closed, closing window');
			await this.ow.closeWindow(windowName);
		} else {
			// Toggle it - if it's open, close it, if it's closed, open it
			console.debug('[ow-window-handler] forcedStatus is null, toggling window');
			if (isWindowClosed(battlegroundsWindow.window_state_ex) || isWindowHidden(battlegroundsWindow.window_state_ex)) {
				console.debug('[ow-window-handler] battlegroundsWindow is closed or hidden, restoring and bringing to front');
				await this.ow.obtainDeclaredWindow(windowName);
				await this.ow.restoreWindow(windowName);
				await this.ow.bringToFront(windowName);
			} else {
				console.debug('[ow-window-handler] battlegroundsWindow is open, closing it');
				await this.ow.closeWindow(windowName);
			}
		}
	}
}

const isWindowClosed = (state: string): boolean => {
	return state === 'closed' || state === 'hidden';
};

const isWindowHidden = (state: string): boolean => {
	return state !== 'normal' && state !== 'maximized';
};