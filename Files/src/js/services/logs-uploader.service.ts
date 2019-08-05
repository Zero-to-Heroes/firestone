import { Injectable } from '@angular/core';

import { S3FileUploadService } from './s3-file-upload.service';
import { SimpleIOService } from './plugins/simple-io.service';
import { OverwolfService } from './overwolf.service';

@Injectable()
export class LogsUploaderService {
	constructor(private io: SimpleIOService, private ow: OverwolfService, private s3: S3FileUploadService) {}

	public async uploadGameLogs(): Promise<string> {
		try {
			// Get the HS Power.log file
			const res = await this.ow.getRunningGameInfo();
			if (!res) {
				return null;
			}
			const logsLocation = res.executionPath.split('Hearthstone.exe')[0] + 'Logs\\Power.log';
			const logLines = await this.io.getFileContents(logsLocation);
			const s3LogFileKey = await this.s3.postLogs(logLines);
			console.log('uploaded logs to S3', s3LogFileKey, 'from location', logsLocation);
			return s3LogFileKey;
		} catch (e) {
			console.error('Exception while uploading logs for troubleshooting', e);
			return null;
		}
	}

	public async uploadAppLogs(): Promise<string> {
		try {
			const firestoneLogs = await this.io.zipAppLogFolder('Firestone');
			const firestoneLogKey = await this.s3.postBinaryFile(firestoneLogs);
			console.log('posted Firestone logs', firestoneLogKey);
			return firestoneLogKey;
		} catch (e) {
			console.error('Exception while uploading logs for troubleshooting', e);
			return null;
		}
	}
}
