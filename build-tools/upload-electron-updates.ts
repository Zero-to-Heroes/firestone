import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as mime from 'mime-types';
import * as path from 'path';

const BUCKET_NAME = 'www.firestoneapp.com';
const UPDATES_PATH = 'updates';
const EXECUTABLES_DIR = 'dist/executables';
const CLOUDFRONT_DISTRIBUTION_ID = process.env.CLOUDFRONT_DISTRIBUTION_ID;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

// Configure AWS SDK
AWS.config.update({
    region: 'us-west-2',
});

const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();

interface UploadStats {
    uploaded: number;
    failed: number;
}

async function uploadFile(filePath: string, key: string, stats: UploadStats): Promise<void> {
    const fileContent = fs.readFileSync(filePath);
    const contentType = mime.lookup(filePath) || 'application/octet-stream';
    const fileSize = (fileContent.length / 1024 / 1024).toFixed(2); // Size in MB

    const params: AWS.S3.PutObjectRequest = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileContent,
        ContentType: contentType,
        ACL: 'public-read', // Make files publicly accessible
        // Don't cache update files - always fetch fresh
        CacheControl: 'no-cache, no-store, must-revalidate',
        Metadata: {
            Pragma: 'no-cache',
            Expires: '0',
        },
    };

    try {
        await s3.upload(params).promise();
        stats.uploaded++;
        console.log(`✓ Uploaded: ${key} (${fileSize}MB)`);
    } catch (error) {
        stats.failed++;
        console.error(`✗ Failed to upload ${key}:`, error);
        throw error;
    }
}

/**
 * Parse version from YAML file (simple parser for version field)
 */
function parseVersionFromYaml(yamlContent: string): string | null {
    // Simple regex to extract version: x.y.z from YAML
    const versionMatch = yamlContent.match(/^version:\s*(.+)$/m);
    if (versionMatch && versionMatch[1]) {
        return versionMatch[1].trim().replace(/['"]/g, ''); // Remove quotes if present
    }
    return null;
}

/**
 * Compare two semantic versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if v1 === v2
 */
function compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    const maxLength = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLength; i++) {
        const part1 = parts1[i] || 0;
        const part2 = parts2[i] || 0;

        if (part1 > part2) return 1;
        if (part1 < part2) return -1;
    }

    return 0;
}

/**
 * Get version from local latest.yml file
 */
function getLocalVersion(): string {
    const latestYmlPath = path.join(EXECUTABLES_DIR, 'latest.yml');

    if (!fs.existsSync(latestYmlPath)) {
        throw new Error(
            `latest.yml not found in ${EXECUTABLES_DIR}. Please run 'npm run full-build:ow-electron' first.`,
        );
    }

    const yamlContent = fs.readFileSync(latestYmlPath, 'utf-8');
    const version = parseVersionFromYaml(yamlContent);

    if (!version) {
        throw new Error(`Could not parse version from latest.yml. Make sure it contains a 'version:' field.`);
    }

    return version;
}

/**
 * Get version from existing latest.yml in S3
 */
async function getRemoteVersion(): Promise<string | null> {
    try {
        const result = await s3
            .getObject({
                Bucket: BUCKET_NAME,
                Key: `${UPDATES_PATH}/latest.yml`,
            })
            .promise();

        if (!result.Body) {
            return null;
        }

        const yamlContent = result.Body.toString('utf-8');
        const version = parseVersionFromYaml(yamlContent);
        return version;
    } catch (error: any) {
        // If file doesn't exist (404), that's okay - it's the first publish
        if (error.code === 'NoSuchKey' || error.statusCode === 404) {
            return null;
        }
        throw error;
    }
}

/**
 * Validate that the new version is greater than the existing one
 */
async function validateVersion(): Promise<void> {
    console.log('🔍 Checking version...');

    const localVersion = getLocalVersion();
    console.log(`   Local version: ${localVersion}`);

    const remoteVersion = await getRemoteVersion();

    if (!remoteVersion) {
        console.log('   No existing version found in S3 (first publish)');
        return;
    }

    console.log(`   Remote version: ${remoteVersion}`);

    const comparison = compareVersions(localVersion, remoteVersion);

    if (comparison <= 0) {
        throw new Error(
            `❌ Version validation failed!\n` +
            `   New version (${localVersion}) must be greater than existing version (${remoteVersion}).\n` +
            `   Please increment the version in package.json before publishing.`,
        );
    }

    console.log(`✓ Version check passed: ${localVersion} > ${remoteVersion}`);
}

/**
 * Parse installer path from latest.yml
 */
function parseInstallerPathFromYaml(yamlContent: string): string | null {
    // Look for the path field which contains the installer filename
    const pathMatch = yamlContent.match(/^path:\s*(.+)$/m);
    if (pathMatch && pathMatch[1]) {
        return pathMatch[1].trim().replace(/['"]/g, ''); // Remove quotes if present
    }
    return null;
}

async function findUpdateFiles(): Promise<Array<{ filePath: string; key: string }>> {
    if (!fs.existsSync(EXECUTABLES_DIR)) {
        throw new Error(
            `Executables directory not found: ${EXECUTABLES_DIR}. Please run 'npm run full-build:ow-electron' first.`,
        );
    }

    const files: Array<{ filePath: string; key: string }> = [];

    // Always upload latest.yml (this is the only yml file we should upload)
    const latestYmlPath = path.join(EXECUTABLES_DIR, 'latest.yml');
    if (!fs.existsSync(latestYmlPath)) {
        throw new Error(
            `latest.yml not found in ${EXECUTABLES_DIR}. Please run 'npm run full-build:ow-electron' first.`,
        );
    }

    files.push({
        filePath: latestYmlPath,
        key: `${UPDATES_PATH}/latest.yml`,
    });

    // Read latest.yml to find the installer filename
    const yamlContent = fs.readFileSync(latestYmlPath, 'utf-8');
    const installerFileName = parseInstallerPathFromYaml(yamlContent);

    if (!installerFileName) {
        throw new Error(
            `Could not parse installer path from latest.yml. Make sure it contains a 'path:' field.`,
        );
    }

    // Find the installer file that matches the path in latest.yml
    const installerPath = path.join(EXECUTABLES_DIR, installerFileName);
    if (!fs.existsSync(installerPath)) {
        throw new Error(
            `Installer file not found: ${installerPath}. Expected based on latest.yml path: ${installerFileName}`,
        );
    }

    files.push({
        filePath: installerPath,
        key: `${UPDATES_PATH}/${installerFileName}`,
    });

    console.log(`   Found files to upload:`);
    console.log(`   - latest.yml`);
    console.log(`   - ${installerFileName}`);

    return files;
}

async function invalidateCloudFrontCache(): Promise<void> {
    if (!CLOUDFRONT_DISTRIBUTION_ID) {
        console.log('⚠️  CLOUDFRONT_DISTRIBUTION_ID environment variable not set, skipping CloudFront cache invalidation');
        return;
    }

    try {
        console.log('🔄 Invalidating CloudFront cache...');

        const params: AWS.CloudFront.CreateInvalidationRequest = {
            DistributionId: CLOUDFRONT_DISTRIBUTION_ID,
            InvalidationBatch: {
                CallerReference: `firestone-electron-update-${Date.now()}`,
                Paths: {
                    Quantity: 1,
                    Items: [`/${UPDATES_PATH}/*`], // Invalidate only the updates path
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

async function invalidateCloudflareCache(): Promise<void> {
    if (!CLOUDFLARE_ZONE_ID || !CLOUDFLARE_API_TOKEN) {
        console.log('⚠️  CLOUDFLARE_ZONE_ID or CLOUDFLARE_API_TOKEN not set, skipping Cloudflare cache invalidation');
        return;
    }

    try {
        console.log('🔄 Invalidating Cloudflare cache...');

        const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                files: [`https://www.firestoneapp.com/${UPDATES_PATH}/*`],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Cloudflare API error: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        if (result.success) {
            console.log('✅ Cloudflare cache invalidation successful');
        } else {
            console.error('❌ Cloudflare cache invalidation failed:', result.errors);
        }
    } catch (error) {
        console.error('❌ Cloudflare cache invalidation failed:', error);
        // Don't throw error here as the upload was successful
    }
}

async function main(): Promise<void> {
    try {
        console.log(`🚀 Starting upload of Electron update files to S3`);
        console.log(`📁 Executables directory: ${EXECUTABLES_DIR}`);
        console.log(`📦 S3 bucket: ${BUCKET_NAME}`);
        console.log(`📂 S3 path: ${UPDATES_PATH}/`);

        // Check if bucket exists and is accessible
        try {
            await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
            console.log('✓ S3 bucket is accessible');
        } catch (error) {
            console.error(`❌ Cannot access S3 bucket: ${BUCKET_NAME}`, error);
            throw error;
        }

        // Validate version before uploading
        await validateVersion();

        // Find update files
        console.log('📊 Finding update files...');
        const files = await findUpdateFiles();
        console.log(`✓ Found ${files.length} file(s) to upload`);

        // Initialize upload stats
        const stats: UploadStats = { uploaded: 0, failed: 0 };
        const startTime = Date.now();

        // Upload files
        console.log('📤 Uploading files...');
        for (const { filePath, key } of files) {
            await uploadFile(filePath, key, stats);
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log('✅ Upload completed!');
        console.log(`📈 Summary: ${stats.uploaded} uploaded, ${stats.failed} failed`);
        console.log(`⏱️  Duration: ${duration}s`);

        if (stats.failed > 0) {
            throw new Error(`${stats.failed} file(s) failed to upload`);
        }

        // Invalidate CloudFront cache
        await invalidateCloudFrontCache();

        // Invalidate Cloudflare cache
        await invalidateCloudflareCache();

        console.log('');
        console.log('🌐 Update files are now available at:');
        console.log(`   https://www.firestoneapp.com/${UPDATES_PATH}/latest.yml`);
        console.log('');
        console.log('✅ All done! Your app will now check for updates from this location.');
    } catch (error) {
        console.error('❌ Upload failed:', error);
        process.exit(1);
    }
}

// Run the upload
main();
