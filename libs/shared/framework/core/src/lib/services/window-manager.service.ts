import { Injectable, Optional } from '@angular/core';
import { OverwolfService } from './overwolf.service';

@Injectable()
export class WindowManagerService {
	private mainWindow;

	constructor(@Optional() private readonly ow: OverwolfService) {
		this.init();
	}

	public async isMainWindow() {
		const currentWindow = await this.ow?.getCurrentWindow();
		return !this.ow || !currentWindow || currentWindow?.name === OverwolfService.MAIN_WINDOW;
	}

	public async getMainWindow() {
		if (!this.mainWindow) {
			await this.init();
		}
		return this.mainWindow;
	}

	private async init() {
		const currentWindow = await this.ow?.getCurrentWindow();
		if (!this.ow || !currentWindow || currentWindow?.name === OverwolfService.MAIN_WINDOW) {
			this.mainWindow = window;
		} else {
			this.mainWindow = this.ow.getMainWindow();
		}
	}
}
