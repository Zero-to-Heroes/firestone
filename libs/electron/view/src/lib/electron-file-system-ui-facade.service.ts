import { Injectable } from '@angular/core';
import {
	AbstractFacadeService,
	IFileSystemUIService,
	isMainProcess,
	WindowManagerService,
} from '@firestone/shared/framework/core';

@Injectable({ providedIn: 'root' })
export class ElectronFileSystemUIFacadeService
	extends AbstractFacadeService<ElectronFileSystemUIFacadeService>
	implements IFileSystemUIService
{
	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ElectronFileSystemUIFacadeService', () => true);
	}

	protected override assignSubjects(): void {}
	protected async init(): Promise<void> {}

	protected override async initElectronMainProcess(): Promise<void> {
		this.registerMainProcessMethod('openPath', (path: string) => this.doOpenPath(path));
		this.registerMainProcessMethod('openFilePicker', (options?: FilePickerOptions) =>
			this.doOpenFilePicker(options),
		);
	}

	protected override createElectronProxy(_ipcRenderer: unknown): void {}
	protected override initElectronSubjects(): void {}

	public async openPath(path: string): Promise<{ success: boolean; error?: string }> {
		if (this.isElectronContext && !isMainProcess()) {
			return this.callOnMainProcess('openPath', path);
		}
		return this.doOpenPath(path);
	}

	public async openFilePicker(options?: FilePickerOptions): Promise<string | undefined> {
		if (this.isElectronContext && !isMainProcess()) {
			return this.callOnMainProcess('openFilePicker', options);
		}
		return this.doOpenFilePicker(options);
	}

	private async doOpenPath(path: string): Promise<{ success: boolean; error?: string }> {
		const { shell } = require('electron');
		const result = await shell.openPath(path);
		return result === '' ? { success: true } : { success: false, error: result };
	}

	private async doOpenFilePicker(options?: FilePickerOptions): Promise<string | undefined> {
		const { dialog, app } = eval('require')('electron');
		const defaultPath = options?.defaultPath ?? app.getPath('userData');
		const result = await dialog.showOpenDialog({
			title: 'Select file',
			defaultPath,
			properties: ['openFile'],
			filters: options?.filters ?? [{ name: 'All Files', extensions: ['*'] }],
		});
		return result.canceled || result.filePaths.length === 0 ? undefined : result.filePaths[0];
	}
}

type FilePickerOptions = { defaultPath?: string; filters?: { name: string; extensions: string[] }[] };
