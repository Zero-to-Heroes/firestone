import { Injectable } from '@angular/core';
import { DuelsStat } from '@firestone-hs/duels-global-stats/dist/stat';
import { ApiRunner } from '@firestone/shared/framework/core';
import { DuelsTimeFilterType } from './duels-meta-heroes.model';

const DUELS_GLOBAL_STATS_URL_SPLIT =
	'https://static.zerotoheroes.com/api/duels/duels-global-stats-hero-class-%mmr%-%date%.gz.json';

@Injectable()
export class DuelsMetaHeroStatsAccessService {
	constructor(private readonly api: ApiRunner) {}

	public async loadMetaHeroes(
		mmr: 100 | 50 | 25 | 10 | 1,
		timeFilter: DuelsTimeFilterType,
	): Promise<DuelsStat | null> {
		const result: DuelsStat | null = await this.api.callGetApi(
			DUELS_GLOBAL_STATS_URL_SPLIT.replace('%mmr%', '' + mmr).replace('%date%', timeFilter),
		);
		console.log('[duels-state-builder] loaded global stats', result?.treasures?.length);
		return result;
	}
}
