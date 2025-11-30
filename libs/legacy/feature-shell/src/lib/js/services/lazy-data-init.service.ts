import { Injectable } from '@angular/core';
import { GlobalStatsService } from './global-stats/global-stats.service';

// Called from the data model, which lives in the main window (even though it is often accessed from
// other windows). So there is no need for a facade
@Injectable()
export class LazyDataInitService {
	constructor(private readonly globalStatsService: GlobalStatsService) {}

	public async requestLoad(dataType: StateDataType) {
		switch (dataType) {
			case 'user-global-stats':
				return this.globalStatsService.loadInitialGlobalStats();
		}
	}
}

export type StateDataType =
	| 'mercenaries-global-stats'
	| 'mercenaries-reference-data'
	| 'user-global-stats'
	| 'reference-quests'
	| 'bgs-meta-hero-stats'
	| 'tavern-brawl-stats';
// | 'battlegrounds-perfect-games';
