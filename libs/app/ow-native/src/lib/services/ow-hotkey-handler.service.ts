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
import { BehaviorSubject } from 'rxjs';

/**
 * Overwolf implementation of global hotkey handling. Listens to hotkeys
 * via Overwolf and depends on the window handler for context when needed.
 */
@Injectable({ providedIn: 'root' })
export class OwHotkeyHandlerService implements IHotkeyHandlerService {
	public liveInfoKeyPressed$$ = new BehaviorSubject<boolean>(false);
	public isCollectionHotkeyActive = false;

	private onCollectionHotkeyPressed: (() => void)[] = [];

	constructor(
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		@Inject(WINDOW_HANDLER_SERVICE_TOKEN) private readonly windowHandler: IWindowHandlerService,
	) {
		this.init();
	}

	public async isReady(): Promise<void> {
		return;
	}

	private async init() {
		await waitForReady(this.prefs);

		this.ow.addHotKeyPressedListener('battlegrounds', async (hotkeyResult) => {
			const prefs: Preferences = await this.prefs.getPreferences();
			this.windowHandler.toggleBattlegroundsWindow(prefs.bgsUseOverlay);
		});
		this.ow.addHotKeyPressedListener('collection', async (hotkeyResult) => {
			if (!this.isCollectionHotkeyActive) {
				return;
			}
			const prefs: Preferences = await this.prefs.getPreferences();
			this.windowHandler.toggleCollectionWindow(prefs.collectionUseOverlay);
			this.onCollectionHotkeyPressed.forEach((listener) => listener());
		});

		this.ow.addHotKeyHoldListener(
			'live-info',
			() => this.liveInfoKeyPressed$$.next(true),
			() => this.liveInfoKeyPressed$$.next(false),
		);
	}

	public addOnCollectionHotkeyPressedListener(listener: () => void): void {
		this.onCollectionHotkeyPressed.push(listener);
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

	async getHotkeyBinding(hotkeyName: string): Promise<string | null> {
		const hotkey = await this.ow.getHotKey(hotkeyName);
		return hotkey?.binding ?? null;
	}
}
