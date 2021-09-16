import { Injectable } from '@angular/core';
import { BgsGlobalStats2 } from '@firestone-hs/bgs-global-stats';
import { Race } from '@firestone-hs/reference-data';
import { BgsStats } from '../../models/battlegrounds/stats/bgs-stats';
import { ApiRunner } from '../api-runner';

// The light version doesn't have tribe filtering
const BGS_STATS_RETRIEVE_URL = 'https://static.zerotoheroes.com/api/bgs/bgs-global-stats-%suffix%.gz.json?v=6';

@Injectable()
export class BgsGlobalStatsService {
	constructor(private readonly api: ApiRunner) {}

	public async loadGlobalStats(tribes: readonly Race[]): Promise<BgsStats> {
		const suffix = !tribes?.length || tribes?.length === 8 ? 'all-tribes' : [...tribes].sort().join('-');
		const url = BGS_STATS_RETRIEVE_URL.replace('%suffix%', suffix);
		console.log('calling URL', url);
		const result: BgsGlobalStats2 = await this.api.callGetApi(url);
		const globalStats = BgsStats.create(result as BgsStats);
		console.debug('retrieved global stats', globalStats);
		return globalStats;
	}
}
