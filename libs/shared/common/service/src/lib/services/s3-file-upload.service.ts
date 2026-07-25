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
		// AWS SDK v3 in Electron/Node cannot hash a Blob's flowing stream — use Buffer there
		const body = await convertBlobToBody(blob);
		const params = {
			Bucket: bucket || BUCKET,
			Key: fileKey,
			// Anonymous uploads are owned by the "anonymous" S3 user; without this ACL
			// the bucket owner (and support tooling) would not be able to read the object
			ACL: 'bucket-owner-full-control' as const,
			Body: body,
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

/**
 * Converts a Blob to the appropriate format for AWS SDK.
 * In Node.js/Electron, converts to Buffer. In browser, returns Blob as-is.
 */
async function convertBlobToBody(blob: Blob): Promise<Buffer | Blob> {
	if (typeof Buffer !== 'undefined') {
		const arrayBuffer = await blob.arrayBuffer();
		return Buffer.from(arrayBuffer);
	}
	return blob;
}
