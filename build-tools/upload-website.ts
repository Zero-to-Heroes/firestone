import { S3 } from 'aws-sdk';
import { createReadStream, promises as fs } from 'fs';
import * as mime from 'mime-types';
import * as path from 'path';

// aws s3 cp ./dist/apps/website s3://www.firestoneapp.gg --recursive  --acl public-read

const uploadDir = async (s3Path: string, bucketName: string) => {
	const s3 = new S3();

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
			return s3
				.putObject({
					Key: targetKey,
					Bucket: bucketName,
					Body: createReadStream(filePath),
					ACL: 'public-read',
					ContentType: type,
				})
				.promise();
		});
	return Promise.all(uploads);
};

uploadDir(path.resolve('./dist/apps/website'), 'www.firestoneapp.gg');
