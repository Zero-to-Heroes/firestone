import { Injectable } from '@angular/core';
import {
	AbstractFacadeService,
	AppInjector,
	isElectronContext,
	isMainProcess,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import * as JSZip from 'jszip';
import { getLogsDir } from './log-utils.service';
import { LOG_FILE_BACKEND, type LogFileBackend } from './logs/log-file-backend';
import { SimpleIOService } from './plugins/simple-io.service';
import { PreferencesService } from './preferences.service';
import { S3FileUploadService } from './s3-file-upload.service';

@Injectable()
export class LogsUploaderService extends AbstractFacadeService<LogsUploaderService> {
	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'LogsUploaderService', () => true);
	}

	protected override assignSubjects(): void {}

	protected async init(): Promise<void> {}

	protected override createElectronProxy(_ipcRenderer: unknown): void {}

	protected override initElectronSubjects(): void {}

	protected override async initElectronMainProcess(): Promise<void> {
		this.registerMainProcessMethod('uploadGameLogs', () => this.doUploadGameLogs());
		this.registerMainProcessMethod('uploadAppLogs', () => this.doUploadAppLogs());
	}

	public async uploadGameLogs(): Promise<string | null> {
		if (isElectronContext() && !isMainProcess()) {
			console.log('[logs-uploader] delegating uploadGameLogs to main process');
			return this.callOnMainProcess('uploadGameLogs');
		}
		return this.doUploadGameLogs();
	}

	public async uploadAppLogs(): Promise<string | null> {
		if (isElectronContext() && !isMainProcess()) {
			console.log('[logs-uploader] delegating uploadAppLogs to main process');
			return this.callOnMainProcess('uploadAppLogs');
		}
		return this.doUploadAppLogs();
	}

	private async doUploadGameLogs(): Promise<string | null> {
		try {
			console.log('[logs-uploader] uploading game logs');
			const logBackend = AppInjector.get(LOG_FILE_BACKEND) as LogFileBackend;
			const prefs = AppInjector.get(PreferencesService);
			const s3 = AppInjector.get(S3FileUploadService);

			const gameInfo = await logBackend.getRunningGameInfo();
			// if (!logBackend.gameRunning(gameInfo)) {
			// 	console.log('[logs-uploader] game is not running, skipping game logs');
			// 	return null;
			// }
			const logsDir = await getLogsDir(logBackend, gameInfo, await prefs.getPreferences());
			if (!logsDir) {
				console.log('[logs-uploader] logs dir is null');
				return null;
			}
			const logsLocation = `${logsDir}\\Power.log`;
			console.log('[logs-uploader] reading power log from', logsLocation);
			const logLines = await logBackend.readTextFile(logsLocation);
			if (!logLines) {
				console.log('[logs-uploader] log lines are null');
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

			console.log('[logs-uploader] uploading game logs to S3, size', content.size);
			const result = await s3.postBlob(content, '.power.zip');
			console.log('[logs-uploader] game logs uploaded to S3', result);
			return result;
		} catch (e) {
			console.warn('[logs-uploader] Exception while uploading game logs', e);
			return null;
		}
	}

	private async doUploadAppLogs(): Promise<string | null> {
		try {
			console.log('[logs-uploader] uploading app logs');
			const io = AppInjector.get(SimpleIOService);
			const s3 = AppInjector.get(S3FileUploadService);

			const firestoneLogs: Blob = await io.zipAppLogFolder('Firestone');
			console.log('[logs-uploader] app logs zip ready, size', firestoneLogs.size);
			const result = await s3.postBlob(firestoneLogs, '.app.zip');
			console.log('[logs-uploader] app logs uploaded to S3', result);
			return result;
		} catch (e) {
			console.warn('[logs-uploader] Exception while uploading app logs', e);
			return null;
		}
	}
}
