import { Inject, Injectable } from '@angular/core';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import {
	IHotkeyHandlerService,
	IWindowHandlerService,
	OverwolfService, waitForReady,
	WINDOW_HANDLER_SERVICE_TOKEN
} from '@firestone/shared/framework/core';

/**
 * Overwolf implementation of global hotkey handling. Listens to hotkeys
 * via Overwolf and depends on the window handler for context when needed.
 */
@Injectable({ providedIn: 'root' })
export class OwHotkeyHandlerService implements IHotkeyHandlerService {
	constructor(
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		@Inject(WINDOW_HANDLER_SERVICE_TOKEN) private readonly windowHandler: IWindowHandlerService
	) {
		this.init();
	}

	private async init() {
		await waitForReady(this.prefs);

		this.ow.addHotKeyPressedListener('battlegrounds', async (hotkeyResult) => {
			const prefs: Preferences = await this.prefs.getPreferences();
			this.windowHandler.toggleBattlegroundsWindow(prefs.bgsUseOverlay);
		});
	}
}
