/* eslint-disable no-async-promise-executor */

declare let OverwolfPlugin: any;

export class LowLevelUtilsElectronService {
	public async flashWindow(windowName = 'Hearthstone'): Promise<void> {
		console.warn('[low-level-utils-electron] flashWindow is not implemented');
	}

	public async showWindowsNotification(title: string, text: string): Promise<void> {
		console.warn('[low-level-utils-electron] showWindowsNotification is not implemented');
	}

	public async captureWindow(windowName: string, copyToClipboard = false): Promise<[string | null, any]> {
		console.warn('[low-level-utils-electron] captureWindow is not implemented');
		return [null, null];
	}

	public async captureActiveWindow(): Promise<[string | null, any]> {
		console.warn('[low-level-utils-electron] captureActiveWindow is not implemented');
		return [null, null];
	}

	public async copyImageDataUrlToClipboard(dataUrl: string): Promise<void> {
		console.warn('[low-level-utils-electron] copyImageDataUrlToClipboard is not implemented');
	}

	public async deleteFileOrFolder(path: string): Promise<void> {
		console.warn('[low-level-utils-electron] deleteFileOrFolder is not implemented');
	}

	public async copyFile(sourcePath: string, destinationDirectory: string): Promise<void> {
		console.warn('[low-level-utils-electron] copyFile is not implemented');
	}

	public async renameFile(sourcePath: string, newName: string): Promise<boolean> {
		console.warn('[low-level-utils-electron] renameFile is not implemented');
		return false;
	}

	public async copyFiles(sourceDirectory: string, destinationDirectory: string): Promise<void> {
		console.warn('[low-level-utils-electron] copyFiles is not implemented');
	}

	public async downloadAndUnzipFile(fileUrl: string, path: string): Promise<void> {
		console.warn('[low-level-utils-electron] downloadAndUnzipFile is not implemented');
	}

	public async downloadFileTo(fileUrl: string, path: string, targetFileName): Promise<boolean> {
		console.warn('[low-level-utils-electron] downloadFileTo is not implemented');
		return false;
	}

	public async get() {
		console.warn('[low-level-utils-electron] get is not implemented');
	}
}
