import { CloudFrontClient, CreateInvalidationCommand, ListDistributionsCommand } from '@aws-sdk/client-cloudfront';

const BUCKET_NAME = 'replays.firestoneapp.com';
const REGION = 'us-west-2';

const cloudfront = new CloudFrontClient({ region: REGION });

async function findDistribution(): Promise<string | null> {
	const result = await cloudfront.send(new ListDistributionsCommand({}));
	if (!result.DistributionList?.Items) {
		return null;
	}

	for (const dist of result.DistributionList.Items) {
		if (
			dist.Aliases?.Items?.includes(BUCKET_NAME) ||
			dist.Origins?.Items?.some((o) => o.DomainName?.includes(BUCKET_NAME))
		) {
			return dist.Id || null;
		}
	}
	return null;
}

async function main(): Promise<void> {
	console.log(`Looking for CloudFront distribution for ${BUCKET_NAME}...`);

	const distributionId = await findDistribution();
	if (!distributionId) {
		console.error(`No CloudFront distribution found for ${BUCKET_NAME}`);
		process.exit(1);
	}

	console.log(`Found distribution: ${distributionId}. Creating invalidation...`);

	const result = await cloudfront.send(
		new CreateInvalidationCommand({
			DistributionId: distributionId,
			InvalidationBatch: {
				CallerReference: `coliseum-deploy-${Date.now()}`,
				Paths: {
					Quantity: 1,
					Items: ['/*'],
				},
			},
		}),
	);

	console.log(`Invalidation created: ${result.Invalidation?.Id}`);
	console.log('CloudFront cache will be cleared within a few minutes.');
}

main().catch((error) => {
	console.error('CloudFront invalidation failed:', error);
	process.exit(1);
});
