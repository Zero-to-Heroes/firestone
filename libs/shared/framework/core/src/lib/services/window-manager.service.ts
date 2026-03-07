import { Injectable, Injector, Optional } from '@angular/core';
import { isElectronContext, isMainProcess } from './electron-utils';
import { MONITORS_SERVICE_TOKEN } from './monitors-service.interface';
import type { IMonitorsService } from './monitors-service.interface';
import { OverwolfService } from './overwolf.service';

@Injectable()
export class WindowManagerService {
	private mainWindow;

	constructor(
		@Optional() private readonly ow: OverwolfService,
		private readonly injector: Injector,
	) {
		this.init();
	}

	public async isMainWindow() {
		if (isElectronContext()) {
			return isMainProcess();
		}
		const currentWindow = await this.ow?.getCurrentWindow();
		return !this.ow || !currentWindow || currentWindow?.name === OverwolfService.MAIN_WINDOW;
	}

	/** Do not use in an electron context, as we can't access the main window */
	public async getMainWindow() {
		if (isElectronContext()) {
			throw new Error("Do not use in an electron context, as we can't access the main window");
		}

		if (!this.mainWindow) {
			await this.init();
		}
		return this.mainWindow;
	}

	public async closeWindow(windowId: string) {
		if (isElectronContext()) {
			return;
		}
		const theWindow = await this.ow.obtainDeclaredWindow(windowId);
		if (theWindow) {
			this.ow.closeWindow(windowId);
			return;
		}
	}

	public async restoreWindow(windowId: string, bringToFront: boolean = false) {
		if (isElectronContext()) {
			return;
		}
		const theWindow = await this.ow.obtainDeclaredWindow(windowId);
		if (theWindow) {
			this.ow.restoreWindow(windowId);
			if (bringToFront) {
				this.ow.bringToFront(windowId);
			}
		}
	}

	public async getMonitorsList() {
		const monitorsService = this.injector.get(MONITORS_SERVICE_TOKEN, null);
		if (!monitorsService) {
			throw new Error('MonitorsService not available');
		}
		return monitorsService.getMonitorsList();
	}

	private async init() {
		// In case of electron, there is no window object
		if (isElectronContext()) {
			return;
		}

		const currentWindow = await this.ow?.getCurrentWindow();
		if (!this.ow || !currentWindow || currentWindow?.name === OverwolfService.MAIN_WINDOW) {
			this.mainWindow = window;
		} else {
			this.mainWindow = this.ow.getMainWindow();
		}
	}
}
