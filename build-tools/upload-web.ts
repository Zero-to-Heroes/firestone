import * as AWS from 'aws-sdk';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as mime from 'mime-types';
import * as path from 'path';

const BUCKET_NAME = 'www.firestoneapp.com';
const BUILD_DIR = 'dist/apps/web';
const CLOUDFRONT_DISTRIBUTION_ID = process.env.CLOUDFRONT_DISTRIBUTION_ID;
const batchSize = 25;

// Configure AWS SDK
AWS.config.update({
	region: 'us-west-2',
});

const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();

interface UploadStats {
	uploaded: number;
	skipped: number;
	total: number;
}

function calculateFileHash(filePath: string): string {
	const fileBuffer = fs.readFileSync(filePath);
	return crypto.createHash('md5').update(fileBuffer).digest('hex');
}

async function getS3ObjectETag(key: string): Promise<string | null> {
	try {
		const result = await s3.headObject({ Bucket: BUCKET_NAME, Key: key }).promise();
		// Remove quotes from ETag if present
		return result.ETag?.replace(/"/g, '') || null;
	} catch (error) {
		// File doesn't exist in S3
		return null;
	}
}

async function shouldUploadFile(filePath: string, key: string): Promise<boolean> {
	const localHash = calculateFileHash(filePath);
	const s3ETag = await getS3ObjectETag(key);

	// If file doesn't exist in S3 or hashes don't match, upload it
	return !s3ETag || localHash !== s3ETag;
}

async function uploadFile(filePath: string, key: string, stats: UploadStats): Promise<void> {
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
		stats.uploaded++;
		console.log(`✓ Uploaded: ${key} (${(fileContent.length / 1024).toFixed(1)}KB)`);
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

async function uploadDirectory(dirPath: string, stats: UploadStats, prefix: string = ''): Promise<void> {
	const items = fs.readdirSync(dirPath);

	// Process files in parallel batches to speed up uploads
	const files: Array<{ itemPath: string; key: string }> = [];
	const directories: Array<{ itemPath: string; key: string }> = [];

	// Separate files and directories
	for (const item of items) {
		const itemPath = path.join(dirPath, item);
		const key = prefix ? `${prefix}/${item}` : item;

		if (fs.statSync(itemPath).isDirectory()) {
			directories.push({ itemPath, key });
		} else {
			files.push({ itemPath, key });
			stats.total++;
		}
	}

	// Process files in parallel batches
	for (let i = 0; i < files.length; i += batchSize) {
		const batch = files.slice(i, i + batchSize);
		const promises = batch.map(async ({ itemPath, key }) => {
			if (await shouldUploadFile(itemPath, key)) {
				await uploadFile(itemPath, key, stats);
			} else {
				stats.skipped++;
				console.log(`↻ Skipped (unchanged): ${key}`);
			}
		});

		await Promise.all(promises);
	}

	// Process directories recursively
	for (const { itemPath, key } of directories) {
		await uploadDirectory(itemPath, stats, key);
	}
}

async function invalidateCloudFrontCache(): Promise<void> {
	if (!CLOUDFRONT_DISTRIBUTION_ID) {
		console.log('⚠️  CLOUDFRONT_DISTRIBUTION_ID environment variable not set, skipping cache invalidation');
		return;
	}

	try {
		console.log('🔄 Invalidating CloudFront cache...');

		const params: AWS.CloudFront.CreateInvalidationRequest = {
			DistributionId: CLOUDFRONT_DISTRIBUTION_ID,
			InvalidationBatch: {
				CallerReference: `firestone-deploy-${Date.now()}`,
				Paths: {
					Quantity: 1,
					Items: ['/*'], // Invalidate all paths
				},
			},
		};

		const result = await cloudfront.createInvalidation(params).promise();
		console.log(`✅ CloudFront cache invalidation initiated: ${result.Invalidation?.Id}`);
		console.log('📝 Note: Cache invalidation may take 5-10 minutes to complete');
	} catch (error) {
		console.error('❌ CloudFront cache invalidation failed:', error);
		// Don't throw error here as the upload was successful
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

		// Configure S3 static website hosting
		await configureS3Website();

		// Initialize upload stats
		const stats: UploadStats = { uploaded: 0, skipped: 0, total: 0 };
		const startTime = Date.now();

		// Upload all files
		console.log('📊 Analyzing files...');
		await uploadDirectory(BUILD_DIR, stats);

		const duration = ((Date.now() - startTime) / 1000).toFixed(1);
		console.log('✅ Upload completed successfully!');
		console.log(`📈 Summary: ${stats.uploaded} uploaded, ${stats.skipped} skipped, ${stats.total} total files`);
		console.log(`⏱️  Duration: ${duration}s`);

		// Invalidate CloudFront cache after successful upload
		await invalidateCloudFrontCache();

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

async function configureS3Website(): Promise<void> {
	const websiteConfig = {
		Bucket: BUCKET_NAME,
		WebsiteConfiguration: {
			IndexDocument: {
				Suffix: 'index.html',
			},
			ErrorDocument: {
				Key: 'index.html', // This is crucial for SPA routing
			},
		},
	};

	try {
		await s3.putBucketWebsite(websiteConfig).promise();
		console.log('✓ S3 static website hosting configured');
	} catch (error) {
		console.error('❌ Failed to configure S3 website hosting:', error);
		throw error;
	}
}

// Run the upload
main();
