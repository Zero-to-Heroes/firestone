import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as mime from 'mime-types';
import * as path from 'path';

const BUCKET_NAME = 'www2.firestoneapp.com';
const BUILD_DIR = 'dist/apps/web';

// Configure AWS SDK
AWS.config.update({
	region: 'us-west-2',
});

const s3 = new AWS.S3();

async function uploadFile(filePath: string, key: string): Promise<void> {
	const fileContent = fs.readFileSync(filePath);
	const contentType = mime.lookup(filePath) || 'application/octet-stream';

	const params: AWS.S3.PutObjectRequest = {
		Bucket: BUCKET_NAME,
		Key: key,
		Body: fileContent,
		ContentType: contentType,
		ACL: 'public-read', // Make files publicly accessible
		// Set cache control based on file type
		CacheControl: getCacheControl(filePath),
	};

	// For HTML files, ensure they're not cached by browsers
	if (filePath.endsWith('.html')) {
		params.CacheControl = 'no-cache, no-store, must-revalidate';
		params.Metadata = {
			Pragma: 'no-cache',
			Expires: '0',
		};
	}

	try {
		const result = await s3.upload(params).promise();
		console.log(`✓ Uploaded: ${key} -> ${result.Location}`);
	} catch (error) {
		console.error(`✗ Failed to upload ${key}:`, error);
		throw error;
	}
}

function getCacheControl(filePath: string): string {
	const ext = path.extname(filePath).toLowerCase();

	// Don't cache HTML files
	if (ext === '.html') {
		return 'no-cache, no-store, must-revalidate';
	}

	// Default cache for other files
	return 'public, max-age=3600'; // 1 hour
}

async function uploadDirectory(dirPath: string, prefix: string = ''): Promise<void> {
	const items = fs.readdirSync(dirPath);

	for (const item of items) {
		const itemPath = path.join(dirPath, item);
		const key = prefix ? `${prefix}/${item}` : item;

		if (fs.statSync(itemPath).isDirectory()) {
			await uploadDirectory(itemPath, key);
		} else {
			await uploadFile(itemPath, key);
		}
	}
}

async function main(): Promise<void> {
	try {
		console.log(`🚀 Starting upload to S3 bucket: ${BUCKET_NAME}`);
		console.log(`📁 Build directory: ${BUILD_DIR}`);

		// Check if build directory exists
		if (!fs.existsSync(BUILD_DIR)) {
			throw new Error(
				`Build directory not found: ${BUILD_DIR}. Please run 'nx build web --configuration=production' first.`,
			);
		}

		// Check if bucket exists and is accessible
		try {
			await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
			console.log('✓ S3 bucket is accessible');
		} catch (error) {
			console.error(`❌ Cannot access S3 bucket: ${BUCKET_NAME}`, error);
			throw error;
		}

		// Upload all files
		await uploadDirectory(BUILD_DIR);

		console.log('✅ Upload completed successfully!');
		console.log(`🌐 Website should be available at:`);
		console.log(`   S3 Website: http://${BUCKET_NAME}.s3-website-us-west-2.amazonaws.com/`);
		console.log(`   S3 HTTPS: https://s3-us-west-2.amazonaws.com/${BUCKET_NAME}/index.html`);
		if (BUCKET_NAME.includes('.')) {
			console.log(`   Custom Domain: https://${BUCKET_NAME}/`);
		}
	} catch (error) {
		console.error('❌ Upload failed:', error);
		process.exit(1);
	}
}

// Run the upload
main();
