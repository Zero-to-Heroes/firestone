import { Inject, Injectable } from '@angular/core';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import {
	HotkeyChangedUnsubscribe,
	HotkeyHoldUnsubscribe,
	IHotkeyHandlerService,
	IWindowHandlerService,
	OverwolfService,
	waitForReady,
	WINDOW_HANDLER_SERVICE_TOKEN,
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
		@Inject(WINDOW_HANDLER_SERVICE_TOKEN) private readonly windowHandler: IWindowHandlerService,
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

	addHotKeyHoldListener(hotkey: string, onDown: () => void, onUp: () => void): HotkeyHoldUnsubscribe {
		return this.ow.addHotKeyHoldListener(hotkey, onDown, onUp);
	}

	removeHotKeyHoldListener(listener: HotkeyHoldUnsubscribe): void {
		this.ow.removeHotKeyHoldListener(listener);
	}

	addHotKeyPressedListener(hotkey: string, callback: () => void): void {
		this.ow.addHotKeyPressedListener(hotkey, callback);
	}

	// removeHotKeyPressedListener(listener: (message: any) => void): void {
	// 	this.ow.removeHotKeyPressedListener(listener);
	// }

	addHotkeyChangedListener(callback: (message: any) => void): HotkeyChangedUnsubscribe {
		return this.ow.addHotkeyChangedListener(callback);
	}

	removeHotkeyChangedListener(listener: HotkeyChangedUnsubscribe): void {
		this.ow.removeHotkeyChangedListener(listener);
	}
}
