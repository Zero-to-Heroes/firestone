import { Injectable } from '@angular/core';
import { uuid } from '@firestone/shared/framework/common';
import * as S3 from 'aws-sdk/clients/s3';
import * as AWS from 'aws-sdk/global';

const BUCKET = 'com.zerotoheroes.support';

@Injectable()
export class S3FileUploadService {
	public async postBlob(blob: Blob, extension?: string, bucket?: string): Promise<string> {
		const fileKey = uuid() + (extension || '');
		AWS.config.region = 'us-west-2';
		AWS.config.httpOptions.timeout = 3600 * 1000 * 10;
		const s3 = new S3();
		const params = {
			Bucket: bucket || BUCKET,
			Key: fileKey,
			ACL: 'public-read-write',
			Body: blob,
		};

		return new Promise<string>((resolve) => {
			s3.makeUnauthenticatedRequest('putObject', params, (err, data2) => {
				// There Was An Error With Your S3 Config
				if (err) {
					console.warn('An error during upload', err);
					resolve(null);
				} else {
					resolve(fileKey);
				}
			});
		});
	}
}
