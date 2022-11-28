import { EventEmitter, Injectable } from '@angular/core';
import { LocalizationService } from './localization.service';
import { OverwolfService } from './overwolf.service';
import { PreferencesService } from './preferences.service';

@Injectable()
export class SystemTrayService {
	private settingsEventBus: EventEmitter<[string, string]>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationService,
		private readonly prefs: PreferencesService,
	) {
		this.init();
	}

	private async init() {
		await this.i18n.initReady();

		const menu: overwolf.os.tray.ExtensionTrayMenu = {
			menu_items: [
				{
					id: 'main-window',
					label: this.i18n.translateString('app.tray.main-window'),
				},
				{
					id: 'settings',
					label: this.i18n.translateString('app.tray.settings'),
				},
				{
					id: 'restart',
					label: this.i18n.translateString('app.tray.restart'),
				},
				{
					id: 'exit',
					label: this.i18n.translateString('app.tray.exit'),
				},
			],
		};

		await this.ow.setTrayMenu(menu);
		this.ow.onTrayMenuClicked((event) => {
			console.debug('[tray] clicked on menu', event);
			switch (event?.item) {
				case 'main-window':
					this.showMainWindow();
					return;
				case 'settings':
					this.showSettingsWindow();
					return;
				case 'restart':
					this.ow.relaunchApp();
					return;
				case 'exit':
					this.exitApp();
					return;
			}
		});
		this.settingsEventBus = this.ow.getMainWindow().settingsEventBus;
	}

	private async showSettingsWindow() {
		this.settingsEventBus.next([null, null]);

		const prefs = await this.prefs.getPreferences();
		const windowName = await this.ow.getSettingsWindowName(prefs);
		const settingsWindow = await this.ow.obtainDeclaredWindow(windowName);
		await this.ow.restoreWindow(settingsWindow.id);
		this.ow.bringToFront(settingsWindow.id);
	}

	private async showMainWindow() {
		const prefs = await this.prefs.getPreferences();
		const window = await this.ow.getCollectionWindow(prefs);
		this.ow.restoreWindow(window.id);
		this.ow.bringToFront(window.id);
	}

	private exitApp() {
		this.ow.closeWindow(OverwolfService.MAIN_WINDOW);
	}
}
