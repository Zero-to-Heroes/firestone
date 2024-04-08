import { Injectable } from '@angular/core';
import { TavernBrawlService } from '../../libs/tavern-brawl/services/tavern-brawl.service';
import { GlobalStatsService } from './global-stats/global-stats.service';
import { QuestsService } from './quests.service';

// Called from the data model, which lives in the main window (even though it is often accessed from
// other windows). So there is no need for a facade
@Injectable()
export class LazyDataInitService {
	constructor(
		private readonly globalStatsService: GlobalStatsService,
		private readonly questsService: QuestsService,
		private readonly tavernBrawlService: TavernBrawlService,
	) {}

	public async requestLoad(dataType: StateDataType) {
		switch (dataType) {
			case 'user-global-stats':
				return this.globalStatsService.loadInitialGlobalStats();
			case 'reference-quests':
				return this.questsService.loadReferenceQuests();
			case 'tavern-brawl-stats':
				return this.tavernBrawlService.loadStats();
		}
	}
}

export type StateDataType =
	| 'mercenaries-global-stats'
	| 'mercenaries-reference-data'
	| 'user-global-stats'
	| 'reference-quests'
	| 'duels-top-decks'
	| 'bgs-meta-hero-stats'
	| 'tavern-brawl-stats';
// | 'battlegrounds-perfect-games';
