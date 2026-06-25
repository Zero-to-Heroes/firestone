import { Injectable } from '@angular/core';
import { ListenObject, OverwolfService } from '@firestone/shared/framework/core';
import { LogDirectoryResult, LogFileBackend, LogListenOptions } from './log-file-backend';

@Injectable()
export class OverwolfLogFileBackendService implements LogFileBackend {
	constructor(private readonly overwolfService: OverwolfService) {}

	async getRunningGameInfo(): Promise<any> {
		return this.overwolfService.getRunningGameInfo();
	}

	gameRunning(gameInfo: any): boolean {
		return this.overwolfService.gameRunning(gameInfo);
	}

	listenOnFile(
		identifier: string,
		filePath: string,
		options: LogListenOptions | null,
		callback: (lineInfo: ListenObject) => void,
	): void {
		this.overwolfService.listenOnFile(identifier, filePath, options, callback);
	}

	stopFileListener(identifier: string): void {
		this.overwolfService.stopFileListener(identifier);
	}

	async fileExists(filePathOnDisk: string): Promise<boolean> {
		return this.overwolfService.fileExists(filePathOnDisk);
	}

	async writeFileContents(filePathOnDisk: string, content: string): Promise<boolean> {
		return this.overwolfService.writeFileContents(filePathOnDisk, content);
	}

	async readTextFile(filePathOnDisk: string): Promise<string> {
		return this.overwolfService.readTextFile(filePathOnDisk);
	}

	async readBinaryFileHead(filePathOnDisk: string, length: number): Promise<Uint8Array | null> {
		return this.overwolfService.readBinaryFileHead(filePathOnDisk, length);
	}

	async listFilesInDirectory(directory: string): Promise<LogDirectoryResult | null> {
		return this.overwolfService.listFilesInDirectory(directory);
	}

	async getGameDbInfo(): Promise<any | null> {
		return this.overwolfService.getGameDbInfo();
	}

	async deleteAppFile(fileName: string): Promise<boolean> {
		return this.overwolfService.deleteAppFile(fileName);
	}

	async storeAppFile(fileName: string, content: string): Promise<boolean> {
		return this.overwolfService.storeAppFile(fileName, content);
	}

	async openLocalCacheFolder(): Promise<void> {
		return this.overwolfService.openLocalCacheFolder();
	}

	async openAppFilePicker(): Promise<string | undefined> {
		return this.overwolfService.openAppFilePicker();
	}
}
