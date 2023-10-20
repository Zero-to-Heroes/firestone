import { Injectable, Optional } from '@angular/core';
import { OverwolfService } from './overwolf.service';

@Injectable()
export class WindowManagerService {
	public mainWindow;

	constructor(@Optional() private readonly ow: OverwolfService) {
		this.init();
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
