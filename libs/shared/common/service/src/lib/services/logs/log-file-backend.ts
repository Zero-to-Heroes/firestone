import { InjectionToken } from '@angular/core';
import { ListenObject } from '@firestone/shared/framework/core';

export interface LogDirectoryEntry {
	readonly name: string;
	readonly type: 'file' | 'dir';
	readonly size?: number;
	readonly lastModified?: number;
}

export interface LogDirectoryResult {
	readonly success: boolean;
	readonly data?: readonly LogDirectoryEntry[];
	readonly path?: string;
}

export interface LogListenOptions {
	skipToEnd?: boolean;
}

export interface LogFileBackend {
	getRunningGameInfo(): Promise<any>;
	gameRunning(gameInfo: any): boolean;
	listenOnFile(
		identifier: string,
		filePath: string,
		options: LogListenOptions | null,
		callback: (lineInfo: ListenObject) => void,
	): void;
	stopFileListener(identifier: string): void;
	fileExists(filePathOnDisk: string): Promise<boolean>;
	writeFileContents(filePathOnDisk: string, content: string): Promise<boolean>;
	readTextFile(filePathOnDisk: string): Promise<string>;
	/** Reads the first `length` bytes of a file (for PE header inspection). */
	readBinaryFileHead(filePathOnDisk: string, length: number): Promise<Uint8Array | null>;
	listFilesInDirectory(directory: string): Promise<LogDirectoryResult | null>;
	getGameDbInfo(): Promise<any | null>;
	deleteAppFile(fileName: string): Promise<boolean>;
	storeAppFile(fileName: string, content: string): Promise<boolean>;
	openLocalCacheFolder(): Promise<void>;
	openAppFilePicker(): Promise<string | undefined>;
}

export const LOG_FILE_BACKEND = new InjectionToken<LogFileBackend>('LOG_FILE_BACKEND');
