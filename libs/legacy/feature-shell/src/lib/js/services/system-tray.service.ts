import { Injectable } from '@angular/core';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { SettingsControllerService } from '@firestone/settings';
import { PreferencesService } from '@firestone/shared/common/service';
import { sleep } from '@firestone/shared/framework/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { LocalizationService } from './localization.service';

@Injectable()
export class SystemTrayService {
	constructor(
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationService,
		private readonly prefs: PreferencesService,
		private readonly mainNav: MainWindowNavigationService,
		private readonly settingsController: SettingsControllerService,
	) {
		this.init();
	}

	private async init() {
		await waitForReady(this.mainNav, this.settingsController);
		await this.i18n.initReady();
		// Not sure why this happens here
		let retriesLeft = 10;
		while (retriesLeft > 0 && this.i18n.translateString('app.tray.main-window') === 'app.tray.main-window') {
			await sleep(500);
			await this.i18n.initReady();
			retriesLeft--;
		}

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
					id: 'reset-positions',
					label: this.i18n.translateString('app.tray.reset-positions'),
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
		const onIconClick = () => this.showMainWindow();
		this.ow.onTrayIconClicked(onIconClick);
		this.ow.onTrayIconDoubleClicked(onIconClick);
		this.ow.onTrayMenuClicked((event) => {
			switch (event?.item) {
				case 'main-window':
					this.showMainWindow();
					return;
				case 'settings':
					this.showSettingsWindow();
					return;
				case 'reset-positions':
					this.resetWindowPositions();
					return;
				case 'restart':
					this.ow.relaunchApp();
					return;
				case 'exit':
					this.exitApp();
					return;
			}
		});
	}

	private async resetWindowPositions() {
		const windows = [
			OverwolfService.COLLECTION_WINDOW,
			OverwolfService.COLLECTION_WINDOW_OVERLAY,
			OverwolfService.SETTINGS_WINDOW,
			OverwolfService.SETTINGS_WINDOW_OVERLAY,
			OverwolfService.LOADING_WINDOW,
			OverwolfService.BATTLEGROUNDS_WINDOW,
			OverwolfService.BATTLEGROUNDS_WINDOW_OVERLAY,
			OverwolfService.LOTTERY_WINDOW,
		];
		for (const w of windows) {
			const cWindow = await this.ow.obtainDeclaredWindow(w);
			const wasVisible = cWindow.isVisible;
			await this.ow.changeWindowPosition(cWindow.id, 0, 0);
			if (!wasVisible) {
				await this.ow.closeWindow(cWindow.id);
			}
		}
	}

	private async showSettingsWindow() {
		const prefs = await this.prefs.getPreferences();
		const windowName = this.ow.getSettingsWindowName(prefs);
		const settingsWindow = await this.ow.obtainDeclaredWindow(windowName);
		await this.ow.restoreWindow(settingsWindow.id);
		this.ow.bringToFront(settingsWindow.id);
	}

	private async showMainWindow() {
		this.mainNav.isVisible$$.next(true);
		const prefs = await this.prefs.getPreferences();
		const window = await this.ow.getCollectionWindow(prefs);
		await this.ow.restoreWindow(window.id);
		await this.ow.bringToFront(window.id);
	}

	private exitApp() {
		console.log('exiting app');
		this.ow.closeWindow(OverwolfService.MAIN_WINDOW);
	}
}
