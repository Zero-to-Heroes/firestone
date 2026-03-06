import { Injectable } from '@angular/core';
import {
	AbstractFacadeService,
	IScreenshotService,
	isElectronContext,
	isMainProcess,
	WindowManagerService,
} from '@firestone/shared/framework/core';

/**
 * Electron implementation of screenshot. Uses AbstractFacadeService pattern:
 * main process registers IPC handler in initElectronMainProcess, renderer uses callOnMainProcess.
 */
@Injectable({ providedIn: 'root' })
export class ElectronScreenshotFacadeService
	extends AbstractFacadeService<ElectronScreenshotFacadeService>
	implements IScreenshotService
{
	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ElectronScreenshotFacadeService', () => true);
	}

	protected override assignSubjects(): void {
		// No subjects
	}

	protected async init(): Promise<void> {
		// No init needed
	}

	protected override async initElectronMainProcess(): Promise<void> {
		const { BrowserWindow, clipboard } = eval('require')('electron');
		this.registerMainProcessMethodWithEvent(
			'captureWindow',
			async (event: any, _windowName: string, copyToClipboard: boolean) => {
				const win = BrowserWindow.fromWebContents(event.sender);
				if (!win || win.isDestroyed()) return [null, null];
				try {
					const image = await win.webContents.capturePage();
					const dataUrl = image.toDataURL();
					if (copyToClipboard) {
						clipboard.writeImage(image);
					}
					return [dataUrl, dataUrl];
				} catch (e) {
					console.warn('[ElectronScreenshotFacadeService] captureWindow failed', e);
					return [null, null];
				}
			},
		);
	}

	protected override createElectronProxy(_ipcRenderer: unknown): void {}
	protected override initElectronSubjects(): void {}

	async captureWindow(windowName: string, copyToClipboard = false): Promise<[string | null, unknown]> {
		if (isElectronContext() && !isMainProcess()) {
			return this.callOnMainProcess('captureWindow', windowName, copyToClipboard);
		}
		return this.doCaptureWindow(windowName, copyToClipboard);
	}

	private async doCaptureWindow(
		_windowName: string,
		_copyToClipboard: boolean,
	): Promise<[string | null, unknown]> {
		return [null, null];
	}
}
