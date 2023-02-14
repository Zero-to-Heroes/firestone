import { Injectable } from '@angular/core';
import { TavernBrawlService } from '../../libs/tavern-brawl/services/tavern-brawl.service';
import { BgsBestUserStatsService } from './battlegrounds/bgs-best-user-stats.service';
import { BgsInitService } from './battlegrounds/bgs-init.service';
import { BgsMetaHeroStatsService } from './battlegrounds/bgs-meta-hero-stats.service';
import { BgsMetaHeroStrategiesService } from './battlegrounds/bgs-meta-hero-strategies.service';
import { BattlegroundsQuestsService } from './battlegrounds/bgs-quests.service';
import { ConstructedMetaDecksStateBuilderService } from './decktracker/constructed-meta-decks-state-builder.service';
import { GlobalStatsService } from './global-stats/global-stats.service';
import { LiveStreamsService } from './mainwindow/live-streams.service';
import { MercenariesStateBuilderService } from './mercenaries/mercenaries-state-builder.service';
import { QuestsService } from './quests.service';

@Injectable()
export class LazyDataInitService {
	constructor(
		private readonly constructedMetaDecksStateBuilder: ConstructedMetaDecksStateBuilderService,
		private readonly mercenariesStateBuilder: MercenariesStateBuilderService,
		private readonly bgsPerfectGamesStateBuilder: BgsInitService,
		private readonly globalStatsService: GlobalStatsService,
		private readonly bgsBestStatsService: BgsBestUserStatsService,
		private readonly bgsMetaHeroStatsStateBuilder: BgsMetaHeroStatsService,
		private readonly bgsMetaHeroStrategiesService: BgsMetaHeroStrategiesService,
		private readonly bgsQuestsService: BattlegroundsQuestsService,
		private readonly questsService: QuestsService,
		private readonly streamsService: LiveStreamsService,
		private readonly tavernBrawlService: TavernBrawlService,
	) {}

	public requestLoad(dataType: StateDataType) {
		switch (dataType) {
			case 'constructed-meta-decks':
				return this.constructedMetaDecksStateBuilder.loadInitialStats();
			case 'mercenaries-global-stats':
				return this.mercenariesStateBuilder.loadInitialGlobalStats();
			case 'mercenaries-reference-data':
				return this.mercenariesStateBuilder.loadInitialReferenceData();
			case 'battlegrounds-perfect-games':
				return this.bgsPerfectGamesStateBuilder.loadInitialPerfectGames();
			case 'bgs-meta-hero-stats':
				return this.bgsMetaHeroStatsStateBuilder.loadInitialMetaHeroStats();
			case 'bgs-meta-hero-strategies':
				return this.bgsMetaHeroStrategiesService.loadMetaHeroStrategies();
			case 'bgs-quest-stats':
				return this.bgsQuestsService.loadInitialReferenceData();
			case 'user-global-stats':
				return this.globalStatsService.loadInitialGlobalStats();
			case 'user-bgs-best-stats':
				return this.bgsBestStatsService.loadBgsBestUserStats();
			case 'reference-quests':
				return this.questsService.loadReferenceQuests();
			case 'live-streams':
				return this.streamsService.loadLiveStreams();
			case 'tavern-brawl-stats':
				return this.tavernBrawlService.loadStats();
		}
	}
}

export type StateDataType =
	| 'constructed-meta-decks'
	| 'mercenaries-global-stats'
	| 'mercenaries-reference-data'
	| 'user-global-stats'
	| 'user-bgs-best-stats'
	| 'reference-quests'
	| 'bgs-meta-hero-stats'
	| 'bgs-meta-hero-strategies'
	| 'bgs-quest-stats'
	| 'live-streams'
	| 'tavern-brawl-stats'
	| 'battlegrounds-perfect-games';
