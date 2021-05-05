import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as JSZip from 'jszip';
import { OverwolfService } from './overwolf.service';
import { SimpleIOService } from './plugins/simple-io.service';
import { S3FileUploadService } from './s3-file-upload.service';

const BUG_ENDPOINT = 'https://vzbzzymjob.execute-api.us-west-2.amazonaws.com/Prod/{proxy+}';

@Injectable()
export class LogsUploaderService {
	constructor(
		private io: SimpleIOService,
		private ow: OverwolfService,
		private s3: S3FileUploadService,
		private http: HttpClient,
	) {}

	public async uploadGameLogs(): Promise<string> {
		try {
			// Get the HS Power.log file
			const res = await this.ow.getRunningGameInfo();
			if (!res) {
				return null;
			}
			const logsLocation = res.executionPath.split('Hearthstone.exe')[0] + 'Logs\\Power.log';
			// console.log('logsLocation', logsLocation);
			const logLines = await this.ow.getFileContents(logsLocation);
			// console.log('uploaded logs with size', logLines?.length, res.executionPath, res);
			const jszip = new JSZip.default();
			jszip.file('power.log', logLines);
			// console.log('ready to zip', logLines?.length, logsLocation);
			const content: Blob = await jszip.generateAsync({
				type: 'blob',
				compression: 'DEFLATE',
				compressionOptions: {
					level: 9,
				},
			});
			// console.log('generated zip', content);
			const s3LogFileKey = await this.s3.postBlob(content, '.power.zip');
			// console.log('uploaded logs to S3', s3LogFileKey, 'from location', logsLocation);
			return s3LogFileKey;
		} catch (e) {
			console.warn('Exception while uploading logs for troubleshooting', e);
			return null;
		}
	}

	public async uploadAppLogs(): Promise<string> {
		try {
			const firestoneLogs: Blob = await this.io.zipAppLogFolder('Firestone');
			const firestoneLogKey = await this.s3.postBlob(firestoneLogs, '.app.zip');
			return firestoneLogKey;
		} catch (e) {
			console.warn('Exception while uploading logs for troubleshooting', e);
			return null;
		}
	}

	public async reportSpecificBug(type: string) {
		const [appLogs, currentUser] = await Promise.all([this.uploadAppLogs(), this.ow.getCurrentUser()]);
		const submission = {
			version: process.env.APP_VERSION,
			type: type,
			user: currentUser ? currentUser.username || currentUser.userId || currentUser.machineId : undefined,
			appLogsKey: appLogs,
		};
		await this.http.post(BUG_ENDPOINT, submission).toPromise();
		console.log('sent automated bug report');
	}
}
