import { Injectable } from '@angular/core';

import AWS from 'aws-sdk';
import { v4 as uuid } from 'uuid';

const BUCKET = 'com.zerotoheroes.support';

@Injectable()
export class S3FileUploadService {
	public async postLogs(logString: string): Promise<string> {
		const fileKey = uuid();
		AWS.config.region = 'us-west-2';
		AWS.config.httpOptions.timeout = 3600 * 1000 * 10;
		const s3 = new AWS.S3();
		const params = {
			Bucket: BUCKET,
			Key: fileKey,
			ACL: 'public-read-write',
			Body: logString,
		};
		console.log('uploading log to S3 with params', params);
		return new Promise<string>(resolve => {
			s3.makeUnauthenticatedRequest('putObject', params, (err, data2) => {
				// There Was An Error With Your S3 Config
				if (err) {
					console.warn('An error during upload', err);
				} else {
					console.log('Uploaded logs', data2);
					resolve(fileKey);
				}
			});
		});
	}

	public async postBinaryFile(biytesAsString: string): Promise<string> {
		const split = biytesAsString.split(',');
		const bytes = [];
		for (let i = 0; i < split.length; i++) {
			bytes[i] = parseInt(split[i]);
		}
		const byteArray = new Uint8Array(bytes);
		const blob = new Blob([byteArray], { type: 'application/zip' });

		const fileKey = uuid();
		AWS.config.region = 'us-west-2';
		AWS.config.httpOptions.timeout = 3600 * 1000 * 10;
		const s3 = new AWS.S3();
		const params = {
			Bucket: BUCKET,
			Key: fileKey,
			ACL: 'public-read-write',
			Body: blob,
		};
		console.log('uploading log to S3 with params', params);
		return new Promise<string>(resolve => {
			s3.makeUnauthenticatedRequest('putObject', params, (err, data2) => {
				// There Was An Error With Your S3 Config
				if (err) {
					console.warn('An error during upload', err);
				} else {
					console.log('Uploaded logs', data2);
					resolve(fileKey);
				}
			});
		});
	}
}
