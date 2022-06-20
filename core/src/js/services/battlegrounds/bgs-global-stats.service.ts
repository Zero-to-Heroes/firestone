import { Injectable } from '@angular/core';
import { BgsGlobalStats2 } from '@firestone-hs/bgs-global-stats';
import { Race } from '@firestone-hs/reference-data';
import { BgsStats } from '../../models/battlegrounds/stats/bgs-stats';
import { ApiRunner } from '../api-runner';

// The light version doesn't have tribe filtering
const BGS_STATS_RETRIEVE_URL = 'https://static.zerotoheroes.com/api/bgs/bgs-global-stats-%suffix%.gz.json';

@Injectable()
export class BgsGlobalStatsService {
	constructor(private readonly api: ApiRunner) {}

	public async loadGlobalStats(tribes: readonly Race[]): Promise<BgsStats> {
		// We know that we only have stats for groups of 5 tribes, so if we are asking for something else,
		// we'll just get the full stats instead
		const suffix = !tribes?.length || tribes?.length !== 5 ? 'all-tribes' : [...tribes].sort().join('-');
		const url = BGS_STATS_RETRIEVE_URL.replace('%suffix%', suffix);
		const result: BgsGlobalStats2 = await this.api.callGetApi(url);
		const globalStats = BgsStats.create(result as BgsStats);
		console.debug('retrieved global stats', globalStats);
		if (!globalStats?.heroStats?.length) {
			console.error('could not load bgs global stats', url, tribes, result);
		}
		return globalStats;
	}
}
