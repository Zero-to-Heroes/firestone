import { Injectable } from '@angular/core';
import { BgsHeroStatsV2 } from '@firestone-hs/bgs-global-stats';
import { ApiRunner } from '@firestone/shared/framework/core';
import { BgsActiveTimeFilterType } from './bgs-active-time-filter.type';

const META_HERO_STATS_URL = 'https://static.zerotoheroes.com/api/bgs/stats-v2/%mmr-folder%/bgs-%timeSuffix%.gz.json';

@Injectable()
export class BgsMetaHeroStatsAccessService {
	constructor(private readonly api: ApiRunner) {}

	public async loadMetaHeroStats(
		timeFilter: BgsActiveTimeFilterType,
		mmr: 100 | 50 | 25 | 10 | 1,
	): Promise<BgsHeroStatsV2> {
		const url = META_HERO_STATS_URL.replace('%mmr-folder%', `mmr-${mmr}`).replace('%timeSuffix%', timeFilter);
		console.debug('[bgs-meta-hero] url', url);
		const result = await this.api.callGetApi<BgsHeroStatsV2>(url);
		console.debug('[bgs-meta-hero] result', result);
		return result;
	}
}
