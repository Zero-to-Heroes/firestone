import { Injectable } from '@angular/core';
import { BgsStats } from '../../models/battlegrounds/stats/bgs-stats';
import { ApiRunner } from '../api-runner';

const BGS_STATS_RETRIEVE_URL = 'https://static.zerotoheroes.com/api/bgs-global-stats.json?v=4';

@Injectable()
export class BgsGlobalStatsService {
	constructor(private readonly api: ApiRunner) {}

	public async loadGlobalStats(): Promise<BgsStats> {
		const result: any = await this.api.callGetApi(BGS_STATS_RETRIEVE_URL);
		const globalStats = BgsStats.create({
			heroStats: result?.heroStats ?? [],
		} as BgsStats);
		return globalStats;
	}
}
