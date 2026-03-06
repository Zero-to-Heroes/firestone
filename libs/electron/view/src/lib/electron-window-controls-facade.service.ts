import { Injectable } from '@angular/core';
import {
	AbstractFacadeService,
	IWindowControlsService,
	IWindowInfo,
	IWindowStateResult,
	isElectronContext,
	isMainProcess,
	WindowManagerService,
} from '@firestone/shared/framework/core';

/**
 * Electron implementation of window controls. Uses AbstractFacadeService pattern:
 * main process registers IPC handlers in initElectronMainProcess, renderer uses callOnMainProcess.
 */
@Injectable({ providedIn: 'root' })
export class ElectronWindowControlsFacadeService
	extends AbstractFacadeService<ElectronWindowControlsFacadeService>
	implements IWindowControlsService
{
	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ElectronWindowControlsFacadeService', () => true);
	}

	protected override assignSubjects(): void {
		// No subjects
	}

	protected async init(): Promise<void> {
		// No init needed
	}

	protected override async initElectronMainProcess(): Promise<void> {
		const { BrowserWindow } = eval('require')('electron');
		this.registerMainProcessMethodWithEvent('getCurrentWindow', (event: any) => {
			const win = BrowserWindow.fromWebContents(event.sender);
			if (!win || win.isDestroyed()) return { id: '', name: '' };
			return {
				id: String(win.id),
				name: win.getTitle?.() || 'unknown',
				stateEx: win.isMaximized() ? 'maximized' : 'normal',
			};
		});
		this.registerMainProcessMethodWithEvent('minimizeWindow', (event: any) => {
			const win = BrowserWindow.fromWebContents(event.sender);
			if (win && !win.isDestroyed()) win.minimize();
		});
		this.registerMainProcessMethodWithEvent('maximizeWindow', (event: any) => {
			const win = BrowserWindow.fromWebContents(event.sender);
			if (win && !win.isDestroyed()) win.maximize();
		});
		this.registerMainProcessMethodWithEvent('restoreWindow', (event: any) => {
			const win = BrowserWindow.fromWebContents(event.sender);
			if (win && !win.isDestroyed()) win.unmaximize();
		});
		this.registerMainProcessMethodWithEvent('closeWindow', (event: any) => {
			const win = BrowserWindow.fromWebContents(event.sender);
			if (win && !win.isDestroyed()) win.close();
		});
		this.registerMainProcessMethodWithEvent('hideWindow', (event) => {
			const win = BrowserWindow.fromWebContents(event.sender);
			if (win && !win.isDestroyed()) win.hide();
		});
		this.registerMainProcessMethodWithEvent('closeWindowFromName', (event: any) => {
			const win = BrowserWindow.fromWebContents(event.sender);
			if (win && !win.isDestroyed()) win.close();
		});
		this.registerMainProcessMethod('inGame', () => false);
		this.registerMainProcessMethod('getWindowState', () => ({ window_state_ex: 'closed' }));
		this.registerMainProcessMethod('getOpenWindows', () => ({}));
	}

	protected override createElectronProxy(_ipcRenderer: unknown): void {}
	protected override initElectronSubjects(): void {}

	canControlWindow(): boolean {
		return isElectronContext() && !isMainProcess();
	}

	async getCurrentWindow(): Promise<IWindowInfo> {
		if (this.isElectronContext && !isMainProcess()) {
			return this.callOnMainProcess<IWindowInfo>('getCurrentWindow');
		}
		return this.doGetCurrentWindow();
	}

	private doGetCurrentWindow(): IWindowInfo {
		return { id: '', name: '' };
	}

	async minimizeWindow(_windowId: string): Promise<void> {
		if (this.isElectronContext && !isMainProcess()) {
			await this.callOnMainProcess('minimizeWindow');
		} else {
			this.doMinimizeWindow();
		}
	}

	private doMinimizeWindow(): void {
		// No-op when called from main (e.g. during init)
	}

	async maximizeWindow(_windowId: string): Promise<void> {
		if (this.isElectronContext && !isMainProcess()) {
			await this.callOnMainProcess('maximizeWindow');
		} else {
			this.doMaximizeWindow();
		}
	}

	private doMaximizeWindow(): void {}

	async restoreWindow(_windowId: string): Promise<void> {
		if (this.isElectronContext && !isMainProcess()) {
			await this.callOnMainProcess('restoreWindow');
		} else {
			this.doRestoreWindow();
		}
	}

	private doRestoreWindow(): void {}

	async closeWindow(_windowId: string): Promise<void> {
		if (this.isElectronContext && !isMainProcess()) {
			await this.callOnMainProcess('closeWindow');
		} else {
			this.doCloseWindow();
		}
	}

	private doCloseWindow(): void {}

	async hideWindow(_windowId: string): Promise<void> {
		if (this.isElectronContext && !isMainProcess()) {
			await this.callOnMainProcess('hideWindow');
		} else {
			this.doHideWindow();
		}
	}

	private doHideWindow(): void {}

	addStateChangedListener(
		_windowName: string,
		_callback: (message: { window_state_ex?: string }) => void,
	): (message: unknown) => void {
		return () => {};
	}

	removeStateChangedListener(_listener: (message: unknown) => void): void {}

	async inGame(): Promise<boolean> {
		if (this.isElectronContext && !isMainProcess()) {
			return this.callOnMainProcess<boolean>('inGame');
		}
		return false;
	}

	async getWindowState(_windowName: string): Promise<IWindowStateResult> {
		if (this.isElectronContext && !isMainProcess()) {
			return this.callOnMainProcess<IWindowStateResult>('getWindowState');
		}
		return { window_state_ex: 'closed' };
	}

	async getOpenWindows(): Promise<Record<string, { id: string; [key: string]: unknown }>> {
		if (this.isElectronContext && !isMainProcess()) {
			return this.callOnMainProcess('getOpenWindows');
		}
		return {};
	}

	async closeWindowFromName(_windowName: string): Promise<void> {
		if (this.isElectronContext && !isMainProcess()) {
			await this.callOnMainProcess('closeWindowFromName');
		} else {
			this.doCloseWindow();
		}
	}
}
