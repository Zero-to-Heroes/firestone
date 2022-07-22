import { Injectable } from '@angular/core';
import { BgsBestUserStatsService } from './battlegrounds/bgs-best-user-stats.service';
import { BgsInitService } from './battlegrounds/bgs-init.service';
import { ConstructedMetaDecksStateBuilderService } from './decktracker/constructed-meta-decks-state-builder.service';
import { GlobalStatsService } from './global-stats/global-stats.service';
import { MercenariesStateBuilderService } from './mercenaries/mercenaries-state-builder.service';

@Injectable()
export class LazyDataInitService {
	constructor(
		private readonly constructedMetaDecksStateBuilder: ConstructedMetaDecksStateBuilderService,
		private readonly mercenariesStateBuilder: MercenariesStateBuilderService,
		private readonly bgsPerfectGamesStateBuilder: BgsInitService,
		private readonly globalStatsService: GlobalStatsService,
		private readonly bgsBestStatsService: BgsBestUserStatsService,
	) {}

	public requestLoad(dataType: StateDataType) {
		console.debug('requesting load', dataType);
		switch (dataType) {
			case 'constructed-meta-decks':
				return this.constructedMetaDecksStateBuilder.loadInitialStats();
			case 'mercenaries-global-stats':
				return this.mercenariesStateBuilder.loadInitialGlobalStats();
			case 'mercenaries-reference-data':
				return this.mercenariesStateBuilder.loadInitialReferenceData();
			case 'battlegrounds-perfect-games':
				return this.bgsPerfectGamesStateBuilder.loadInitialPerfectGames();
			case 'user-global-stats':
				return this.globalStatsService.loadInitialGlobalStats();
			case 'user-bgs-best-stats':
				return this.bgsBestStatsService.loadBgsBestUserStats();
		}
	}
}

export type StateDataType =
	| 'constructed-meta-decks'
	| 'mercenaries-global-stats'
	| 'mercenaries-reference-data'
	| 'user-global-stats'
	| 'user-bgs-best-stats'
	| 'battlegrounds-perfect-games';
