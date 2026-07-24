import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createReadStream, promises as fs } from 'fs';
import * as mime from 'mime-types';
import * as path from 'path';

const REGION = 'us-west-2';

const uploadDir = async (s3Path: string, bucketName: string) => {
	const s3 = new S3Client({ region: REGION });

	// Recursive getFiles from
	// https://stackoverflow.com/a/45130990/831465
	const getFiles = async (dir: string): Promise<string | string[]> => {
		const dirents = await fs.readdir(dir, { withFileTypes: true });
		const files = await Promise.all(
			dirents.map((dirent) => {
				const res = path.resolve(dir, dirent.name);
				return dirent.isDirectory() ? getFiles(res) : res;
			}),
		);
		return Array.prototype.concat(...files);
	};

	const files = (await getFiles(s3Path)) as string[];
	const uploads = files
		.map((filePath) => filePath.replace(/\\/gm, '/'))
		.map((filePath) => {
			const targetKey = path.relative(s3Path, filePath).replace(/\\/gm, '/');
			const type: string = (mime.lookup(filePath) || null) as string;
			console.debug('uploading', filePath, 'to', targetKey);
			return s3.send(
				new PutObjectCommand({
					Key: targetKey,
					Bucket: bucketName,
					Body: createReadStream(filePath),
					ACL: 'public-read',
					ContentType: type,
				}),
			);
		});
	return Promise.all(uploads);
};

uploadDir(path.resolve('./dist/apps/coliseum'), 'replays.firestoneapp.com');
