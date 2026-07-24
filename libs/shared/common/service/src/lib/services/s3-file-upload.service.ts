/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@angular/core';
import { uuid } from '@firestone/shared/framework/common';
import { FetchHttpHandler } from '@smithy/fetch-http-handler';

const BUCKET = 'com.zerotoheroes.support';

function createAnonymousS3Client(): S3Client {
	return new S3Client({
		region: 'us-west-2',
		credentials: { accessKeyId: '', secretAccessKey: '' },
		signer: { sign: async (request) => request },
		// Fetch works in browser and Electron main (unlike XHR, which is browser-only)
		requestHandler: new FetchHttpHandler({
			requestTimeout: 3600 * 1000 * 10,
		}),
	});
}

@Injectable()
export class S3FileUploadService {
	public async postBlob(blob: Blob, extension?: string, bucket?: string): Promise<string | null> {
		const fileKey = uuid() + (extension || '');
		console.log('[s3-upload] uploading blob', { fileKey, size: blob.size, extension, bucket: bucket || BUCKET });
		const s3 = createAnonymousS3Client();
		const params = {
			Bucket: bucket || BUCKET,
			Key: fileKey,
			// Anonymous uploads are owned by the "anonymous" S3 user; without this ACL
			// the bucket owner (and support tooling) would not be able to read the object
			ACL: 'bucket-owner-full-control' as const,
			Body: blob,
		};

		try {
			await s3.send(new PutObjectCommand(params));
			console.log('[s3-upload] upload successful', fileKey);
			return fileKey;
		} catch (err) {
			console.warn('[s3-upload] error during upload', fileKey, err);
			return null;
		}
	}
}
