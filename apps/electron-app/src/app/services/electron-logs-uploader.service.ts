import { Inject, Injectable } from '@angular/core';
import {
	LOG_FILE_BACKEND,
	getLogsDir,
	type LogFileBackend,
	PreferencesService,
	S3FileUploadService,
} from '@firestone/shared/common/service';
import * as JSZip from 'jszip';
import { promises as fsPromises } from 'fs';
import { join } from 'path';
import { ElectronDiskCacheService } from './electron-disk-cache.service';

@Injectable()
export class ElectronLogsUploaderService {
	constructor(
		@Inject(LOG_FILE_BACKEND) private readonly logBackend: LogFileBackend,
		private readonly diskCache: ElectronDiskCacheService,
		private readonly s3: S3FileUploadService,
		private readonly prefs: PreferencesService,
	) {}

	public async uploadGameLogs(): Promise<string | null> {
		try {
			const gameInfo = await this.logBackend.getRunningGameInfo();
			if (!this.logBackend.gameRunning(gameInfo)) {
				return null;
			}
			const prefs = await this.prefs.getPreferences();
			const logsDir = await getLogsDir(this.logBackend, gameInfo, prefs);
			if (!logsDir) {
				return null;
			}
			const logsLocation = `${logsDir}\\Power.log`;
			const logLines = await this.logBackend.readTextFile(logsLocation);
			if (!logLines) {
				return null;
			}

			const jszip = new JSZip();
			jszip.file('power.log', logLines);

			const content: Blob = await jszip.generateAsync({
				type: 'blob',
				compression: 'DEFLATE',
				compressionOptions: {
					level: 9,
				},
			});

			return await this.s3.postBlob(content, '.power.zip');
		} catch (e) {
			console.warn('[electron-logs-uploader] Exception while uploading game logs', e);
			return null;
		}
	}

	public async uploadAppLogs(): Promise<string | null> {
		try {
			const logsDir = this.diskCache.getLogsDirectory();
			const jszip = new JSZip();

			await this.addDirectoryToZip(jszip, logsDir, '');

			const content: Blob = await jszip.generateAsync({
				type: 'blob',
				compression: 'DEFLATE',
				compressionOptions: {
					level: 9,
				},
			});

			return await this.s3.postBlob(content, '.app.zip');
		} catch (e) {
			console.warn('[electron-logs-uploader] Exception while uploading app logs', e);
			return null;
		}
	}

	private async addDirectoryToZip(jszip: JSZip, dirPath: string, zipPath: string): Promise<void> {
		try {
			const entries = await fsPromises.readdir(dirPath, { withFileTypes: true });
			for (const entry of entries) {
				const fullPath = join(dirPath, entry.name);
				const entryZipPath = zipPath ? `${zipPath}/${entry.name}` : entry.name;

				if (entry.isDirectory()) {
					await this.addDirectoryToZip(jszip, fullPath, entryZipPath);
				} else if (entry.isFile()) {
					const content = await fsPromises.readFile(fullPath, { encoding: 'utf8' });
					jszip.file(entryZipPath, content);
				}
			}
		} catch (e) {
			console.warn('[electron-logs-uploader] Could not read directory', dirPath, e);
		}
	}
}
