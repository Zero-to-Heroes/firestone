import { Injectable } from '@angular/core';
import {
	IWindowControlsService,
	IWindowInfo,
	IWindowStateResult,
} from './window-controls-service.interface';
import { OverwolfService } from './overwolf.service';

/**
 * Overwolf implementation of window controls. Delegates to OverwolfService.
 */
@Injectable()
export class OverwolfWindowControlsFacadeService implements IWindowControlsService {
	constructor(private readonly ow: OverwolfService) {}

	canControlWindow(): boolean {
		return this.ow?.isOwEnabled() ?? false;
	}

	async getCurrentWindow(): Promise<IWindowInfo> {
		const win = await this.ow.getCurrentWindow();
		return win
			? {
					id: win.id,
					name: win.name,
					stateEx: (win as any).stateEx,
				}
			: { id: '', name: '' };
	}

	async minimizeWindow(windowId: string): Promise<void> {
		await this.ow.minimizeWindow(windowId);
	}

	async maximizeWindow(windowId: string): Promise<void> {
		await this.ow.maximizeWindow(windowId);
	}

	async restoreWindow(windowId: string): Promise<void> {
		await this.ow.restoreWindow(windowId);
	}

	async closeWindow(windowId: string): Promise<void> {
		await this.ow.closeWindow(windowId);
	}

	async hideWindow(windowId: string): Promise<void> {
		await this.ow.hideWindow(windowId);
	}

	addStateChangedListener(
		windowName: string,
		callback: (message: { window_state_ex?: string }) => void,
	): (message: unknown) => void {
		return this.ow.addStateChangedListener(windowName, callback);
	}

	removeStateChangedListener(listener: (message: unknown) => void): void {
		this.ow.removeStateChangedListener(listener);
	}

	async inGame(): Promise<boolean> {
		return this.ow.inGame();
	}

	async getWindowState(windowName: string): Promise<IWindowStateResult> {
		return this.ow.getWindowState(windowName);
	}

	async getOpenWindows(): Promise<Record<string, { id: string; [key: string]: unknown }>> {
		return this.ow.getOpenWindows() as unknown as Promise<
			Record<string, { id: string; [key: string]: unknown }>
		>;
	}

	async closeWindowFromName(windowName: string): Promise<void> {
		await this.ow.closeWindowFromName(windowName);
	}
}
