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
		const forcedStatus = options?.forced ?? null;
		const canBringUpFromMinimized = options?.canBringUpFromMinimized ?? true;

		const windowId = useOverlay
			? OverwolfService.BATTLEGROUNDS_WINDOW_OVERLAY
			: OverwolfService.BATTLEGROUNDS_WINDOW;

		const battlegroundsWindow = await this.ow.getWindowState(windowId);
		// Minimize is only triggered by a user action, so if they minimize it we don't touch it
		if (!canBringUpFromMinimized && battlegroundsWindow.window_state_ex === 'minimized') {
			return;
		}

		if (forcedStatus === 'open') {
			await this.ow.obtainDeclaredWindow(windowId);
			if (
				battlegroundsWindow.window_state_ex !== 'maximized' &&
				battlegroundsWindow.stateEx !== 'maximized'
			) {
				await this.ow.restoreWindow(windowId);
				await this.ow.bringToFront(windowId);
			}
		} else if (forcedStatus === 'closed') {
			await this.ow.closeWindow(windowId);
		}
	}
}
