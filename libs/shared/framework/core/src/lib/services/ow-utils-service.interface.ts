import { InjectionToken } from '@angular/core';

export const OW_UTILS_SERVICE_TOKEN = new InjectionToken<IOwUtilsService>('OwUtilsService');

export interface IOwUtilsService {
	flashWindow(windowName?: string): Promise<void>;
	showWindowsNotification(title: string, text: string): Promise<void>;
	captureWindow(windowName: string, copyToClipboard?: boolean): Promise<[string | null, unknown]>;
	captureActiveWindow(): Promise<[string | null, unknown]>;
	copyImageDataUrlToClipboard(dataUrl: string): Promise<void>;
	deleteFileOrFolder(path: string): Promise<void>;
	copyFile(sourcePath: string, destinationDirectory: string): Promise<void>;
	renameFile(sourcePath: string, newName: string): Promise<boolean>;
	copyFiles(sourceDirectory: string, destinationDirectory: string): Promise<void>;
	downloadAndUnzipFile(fileUrl: string, path: string): Promise<void>;
	downloadFileTo(fileUrl: string, path: string, targetFileName: string): Promise<boolean>;
	get(): Promise<unknown>;
}
