import { Injectable } from '@angular/core';
import { ApiRunner } from '@firestone/shared/framework/core';

// The light version doesn't have tribe filtering

/** @deprecated */
@Injectable()
export class BgsGlobalStatsService {
	constructor(private readonly api: ApiRunner) {}

	// public async loadGlobalStats(tribes: readonly Race[], timePeriod: BgsActiveTimeFilterType): Promise<BgsStats> {
	// 	// We know that we only have stats for groups of 5 tribes, so if we are asking for something else,
	// 	// we'll just get the full stats instead
	// 	const tribesSuffix = !tribes?.length || tribes?.length !== 5 ? 'all-tribes' : [...tribes].sort().join('-');
	// 	const timeSuffix = timePeriod;
	// 	const url = BGS_STATS_RETRIEVE_URL.replace('%tribeSuffix%', tribesSuffix).replace(
	// 		'%timeSuffix%',
	// 		fixInvalidTimeSuffix(timeSuffix),
	// 	);
	// 	const result: BgsGlobalStats2 = await this.api.callGetApi(url);
	// 	const globalStats = BgsStats.create({
	// 		allTribes: result?.allTribes ?? [],
	// 		heroStats: result?.heroStats ?? [],
	// 		lastUpdateDate: result?.lastUpdateDate,
	// 		mmrPercentiles: result?.mmrPercentiles ?? [],
	// 		initComplete: true,
	// 	} as BgsStats);
	// 	if (!globalStats?.heroStats?.length) {
	// 		console.error('could not load bgs global stats', url, tribes, result);
	// 	}
	// 	return globalStats;
	// }
}
