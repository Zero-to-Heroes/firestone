/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { uuid } from '@firestone/shared/framework/common';
import * as S3 from 'aws-sdk/clients/s3';
import * as AWS from 'aws-sdk/global';

const BUCKET = 'com.zerotoheroes.support';

@Injectable()
export class S3FileUploadService {
	public async postBlob(blob: Blob, extension?: string, bucket?: string): Promise<string | null> {
		const fileKey = uuid() + (extension || '');
		console.log('[s3-upload] uploading blob', { fileKey, size: blob.size, extension, bucket: bucket || BUCKET });
		AWS.config.region = 'us-west-2';
		AWS.config.httpOptions!.timeout = 3600 * 1000 * 10;
		const s3 = new S3();
		const params = {
			Bucket: bucket || BUCKET,
			Key: fileKey,
			// Anonymous uploads are owned by the "anonymous" S3 user; without this ACL
			// the bucket owner (and support tooling) would not be able to read the object
			ACL: 'bucket-owner-full-control',
			Body: blob,
		};

		return new Promise<string | null>((resolve) => {
			s3.makeUnauthenticatedRequest('putObject', params, (err, data2) => {
				if (err) {
					console.warn('[s3-upload] error during upload', fileKey, err);
					resolve(null);
				} else {
					console.log('[s3-upload] upload successful', fileKey);
					resolve(fileKey);
				}
			});
		});
	}
}
