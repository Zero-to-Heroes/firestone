import { Injectable } from '@angular/core';
import { BgsGlobalStats2 } from '@firestone-hs/bgs-global-stats';
import { Race } from '@firestone-hs/reference-data';
import { BgsActiveTimeFilterType } from '@firestone/battlegrounds/data-access';
import { ApiRunner } from '@firestone/shared/framework/core';
import { BgsStats } from '../../models/battlegrounds/stats/bgs-stats';

// The light version doesn't have tribe filtering
const BGS_STATS_RETRIEVE_URL =
	'https://static.zerotoheroes.com/api/bgs/heroes/bgs-global-stats-%tribeSuffix%-%timeSuffix%.gz.json';
// Current new process doesn't scale properly, so reverting to the old one for now (without time)
// const BGS_STATS_RETRIEVE_URL = 'https://static.zerotoheroes.com/api/bgs/bgs-global-stats-%tribeSuffix%.gz.json';

@Injectable()
export class BgsGlobalStatsService {
	constructor(private readonly api: ApiRunner) {}

	public async loadGlobalStats(tribes: readonly Race[], timePeriod: BgsActiveTimeFilterType): Promise<BgsStats> {
		// We know that we only have stats for groups of 5 tribes, so if we are asking for something else,
		// we'll just get the full stats instead
		const tribesSuffix = !tribes?.length || tribes?.length !== 5 ? 'all-tribes' : [...tribes].sort().join('-');
		const timeSuffix = timePeriod;
		const url = BGS_STATS_RETRIEVE_URL.replace('%tribeSuffix%', tribesSuffix).replace(
			'%timeSuffix%',
			fixInvalidTimeSuffix(timeSuffix),
		);
		const result: BgsGlobalStats2 = await this.api.callGetApi(url);
		const globalStats = BgsStats.create({
			allTribes: result?.allTribes ?? [],
			heroStats: result?.heroStats ?? [],
			lastUpdateDate: result?.lastUpdateDate,
			mmrPercentiles: result?.mmrPercentiles ?? [],
			initComplete: true,
		} as BgsStats);
		if (!globalStats?.heroStats?.length) {
			console.error('could not load bgs global stats', url, tribes, result);
		}
		return globalStats;
	}
}

export const fixInvalidTimeSuffix = (timeSuffix: string): BgsActiveTimeFilterType => {
	switch (timeSuffix) {
		case 'past-7':
			return 'past-seven';
		case 'past-3':
			return 'past-three';
	}
	return timeSuffix as BgsActiveTimeFilterType;
};
