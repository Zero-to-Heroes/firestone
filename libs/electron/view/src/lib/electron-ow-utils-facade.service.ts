import { Injectable } from '@angular/core';
import { buildOwUtilsIpcChannel } from '@firestone/shared/framework/core';
import type { IOwUtilsService } from '@firestone/shared/framework/core';

@Injectable({ providedIn: 'root' })
export class ElectronOwUtilsFacadeService implements IOwUtilsService {
	public async flashWindow(windowName = 'Hearthstone'): Promise<void> {
		return this.invoke('flashWindow', undefined as void, windowName);
	}

	public async showWindowsNotification(title: string, text: string): Promise<void> {
		return this.invoke('showWindowsNotification', undefined as void, title, text);
	}

	public async captureWindow(windowName: string, copyToClipboard = false): Promise<[string | null, unknown]> {
		return this.invoke('captureWindow', [null, null], windowName, copyToClipboard);
	}

	public async captureActiveWindow(): Promise<[string | null, unknown]> {
		return this.invoke('captureActiveWindow', [null, null]);
	}

	public async copyImageDataUrlToClipboard(dataUrl: string): Promise<void> {
		return this.invoke('copyImageDataUrlToClipboard', undefined as void, dataUrl);
	}

	public async deleteFileOrFolder(path: string): Promise<void> {
		return this.invoke('deleteFileOrFolder', undefined as void, path);
	}

	public async copyFile(sourcePath: string, destinationDirectory: string): Promise<void> {
		return this.invoke('copyFile', undefined as void, sourcePath, destinationDirectory);
	}

	public async renameFile(sourcePath: string, newName: string): Promise<boolean> {
		return this.invoke('renameFile', false, sourcePath, newName);
	}

	public async copyFiles(sourceDirectory: string, destinationDirectory: string): Promise<void> {
		return this.invoke('copyFiles', undefined as void, sourceDirectory, destinationDirectory);
	}

	public async downloadAndUnzipFile(fileUrl: string, path: string): Promise<void> {
		return this.invoke('downloadAndUnzipFile', undefined as void, fileUrl, path);
	}

	public async downloadFileTo(fileUrl: string, path: string, targetFileName: string): Promise<boolean> {
		return this.invoke('downloadFileTo', false, fileUrl, path, targetFileName);
	}

	public async get(): Promise<unknown> {
		return null;
	}

	private async invoke<T>(methodName: keyof IOwUtilsService, fallback: T, ...args: readonly unknown[]): Promise<T> {
		try {
			const ipcRenderer = (window as any)?.require?.('electron')?.ipcRenderer;
			if (!ipcRenderer) {
				console.warn('[electron-ow-utils] ipcRenderer not available for', methodName);
				return fallback;
			}
			return ipcRenderer.invoke(buildOwUtilsIpcChannel(methodName), ...args);
		} catch (e) {
			console.warn('[electron-ow-utils] IPC call failed', methodName, e);
			return fallback;
		}
	}
}
