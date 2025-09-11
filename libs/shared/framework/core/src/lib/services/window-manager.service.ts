import { Injectable, Optional } from '@angular/core';
import { isElectronContext, isMainProcess } from './electron-utils';
import { OverwolfService } from './overwolf.service';

@Injectable()
export class WindowManagerService {
	private mainWindow;

	constructor(@Optional() private readonly ow: OverwolfService) {
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
