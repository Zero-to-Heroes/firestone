import { InjectionToken } from '@angular/core';

export const FILE_SYSTEM_UI_SERVICE_TOKEN = new InjectionToken<IFileSystemUIService>('FileSystemUIService');

export interface IFileSystemUIService {
	/** Open a path in the system file explorer (e.g. Windows Explorer, Finder). */
	openPath(path: string): Promise<{ success: boolean; error?: string }>;

	/** Show a native dialog to pick a file and return its path. */
	openFilePicker(options?: {
		defaultPath?: string;
		filters?: { name: string; extensions: string[] }[];
	}): Promise<string | undefined>;
}
