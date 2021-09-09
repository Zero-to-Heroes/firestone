import { Injectable } from '@angular/core';
import { BgsGlobalStats2 } from '@firestone-hs/bgs-global-stats';
import { BgsStats } from '../../models/battlegrounds/stats/bgs-stats';
import { ApiRunner } from '../api-runner';

// The light version doesn't have tribe filtering
const BGS_STATS_RETRIEVE_URL = 'https://static.zerotoheroes.com/api/bgs/bgs-global-stats-all-tribes.gz.json?v=5';

@Injectable()
export class BgsGlobalStatsService {
	constructor(private readonly api: ApiRunner) {}

	public async loadGlobalStats(): Promise<BgsStats> {
		const result: BgsGlobalStats2 = await this.api.callGetApi(BGS_STATS_RETRIEVE_URL);
		const globalStats = BgsStats.create(result as BgsStats);
		console.debug('retrieved global stats', globalStats);
		return globalStats;
	}
}
