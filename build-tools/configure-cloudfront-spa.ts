import * as AWS from 'aws-sdk';

const BUCKET_NAME = 'www.firestoneapp.com';
const REGION = 'us-west-2';

// Configure AWS SDK
AWS.config.update({
	region: REGION,
});

const cloudfront = new AWS.CloudFront();

async function findDistribution(): Promise<string | null> {
	try {
		const result = await cloudfront.listDistributions().promise();

		if (!result.DistributionList?.Items) {
			console.log('No CloudFront distributions found');
			return null;
		}

		// Look for distribution serving our domain
		for (const dist of result.DistributionList.Items) {
			if (
				dist.Aliases?.Items?.includes(BUCKET_NAME) ||
				dist.Origins?.Items?.[0]?.DomainName?.includes(BUCKET_NAME)
			) {
				console.log(`Found distribution: ${dist.Id}`);
				console.log(`Current origin: ${dist.Origins?.Items?.[0]?.DomainName}`);
				return dist.Id || null;
			}
		}

		console.log('No distribution found for domain:', BUCKET_NAME);
		return null;
	} catch (error) {
		console.error('Error finding distribution:', error);
		return null;
	}
}

async function updateDistribution(distributionId: string): Promise<void> {
	try {
		// Get current distribution config
		const configResult = await cloudfront
			.getDistributionConfig({
				Id: distributionId,
			})
			.promise();

		if (!configResult.DistributionConfig || !configResult.ETag) {
			throw new Error('Failed to get distribution config');
		}

		const config = configResult.DistributionConfig;

		// Update origin to point to S3 website endpoint
		if (config.Origins?.Items?.[0]) {
			const correctOrigin = `${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com`;
			const currentOrigin = config.Origins.Items[0].DomainName;

			if (currentOrigin === correctOrigin) {
				console.log('✓ Origin is already correctly configured');
			} else {
				console.log(`Updating origin from ${currentOrigin} to ${correctOrigin}`);
				config.Origins.Items[0].DomainName = correctOrigin;

				// Update origin protocol policy for website endpoint
				if (config.Origins.Items[0].CustomOriginConfig) {
					config.Origins.Items[0].CustomOriginConfig.HTTPPort = 80;
					config.Origins.Items[0].CustomOriginConfig.OriginProtocolPolicy = 'http-only';
				} else {
					// Remove S3OriginConfig and add CustomOriginConfig
					delete config.Origins.Items[0].S3OriginConfig;
					config.Origins.Items[0].CustomOriginConfig = {
						HTTPPort: 80,
						HTTPSPort: 443,
						OriginProtocolPolicy: 'http-only',
					};
				}
			}
		}

		// Configure custom error pages for SPA routing
		config.CustomErrorResponses = {
			Quantity: 2,
			Items: [
				{
					ErrorCode: 404,
					ResponsePagePath: '/index.html',
					ResponseCode: '200',
					ErrorCachingMinTTL: 0,
				},
				{
					ErrorCode: 403,
					ResponsePagePath: '/index.html',
					ResponseCode: '200',
					ErrorCachingMinTTL: 0,
				},
			],
		};

		// Update the distribution
		const updateResult = await cloudfront
			.updateDistribution({
				Id: distributionId,
				DistributionConfig: config,
				IfMatch: configResult.ETag,
			})
			.promise();

		console.log('✅ CloudFront distribution updated successfully!');
		console.log('⏳ Changes may take 10-15 minutes to propagate globally');
		console.log(`🌐 Distribution URL: https://${BUCKET_NAME}/`);
	} catch (error) {
		console.error('❌ Failed to update distribution:', error);
		throw error;
	}
}

async function main(): Promise<void> {
	try {
		console.log('🔍 Looking for CloudFront distribution...');

		const distributionId = await findDistribution();

		if (!distributionId) {
			console.log('');
			console.log('📝 Manual Configuration Required:');
			console.log('');
			console.log("If you're using CloudFront:");
			console.log('1. Go to CloudFront console');
			console.log('2. Find your distribution for www.firestoneapp.com');
			console.log('3. Edit the Origin:');
			console.log(`   - Change origin to: ${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com`);
			console.log('   - Set Origin Protocol Policy to "HTTP Only"');
			console.log('4. Add Custom Error Pages:');
			console.log('   - 404 → /index.html (200 response)');
			console.log('   - 403 → /index.html (200 response)');
			console.log('');
			console.log("If you're using Route 53 alias:");
			console.log('1. Go to Route 53 console');
			console.log('2. Update the A record for www.firestoneapp.com');
			console.log(`3. Point it to: ${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com`);
			return;
		}

		console.log('🔧 Updating CloudFront distribution...');
		await updateDistribution(distributionId);
	} catch (error) {
		console.error('❌ Configuration failed:', error);
		process.exit(1);
	}
}

// Run the configuration
main();
