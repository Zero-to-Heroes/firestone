import { Injectable } from '@angular/core';
import { IBattlegroundsWindowOptions, IWindowHandlerService } from '@firestone/shared/framework/core';

/**
 * Electron implementation of window handling. Single place responsible for
 * managing windows when running in the Electron app.
 */
@Injectable()
export class ElectronWindowHandlerService implements IWindowHandlerService {
	public toggleBattlegroundsWindow(_useOverlay: boolean, _options?: IBattlegroundsWindowOptions) {
		// Battlegrounds window is handled by the overlay in Electron; no-op here
	}

	public openSettingsWindow(useOverlay: boolean): void {
		// TODO: implement the window management here, instead of in the App class
		// If useOverlay is true, the window should open as an overlay window, otherwise it should open as a normal window
	}
}
