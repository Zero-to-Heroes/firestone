import { Injectable } from '@angular/core';
import { BgsBoardHighlighterService } from './bgs-board-highlighter.service';
import { BattlegroundsCardsService } from './bgs-cards.service';
import { BattlegroundsCompsService } from './bgs-comps.service';
import { BgsInGameTimewarpedGuardianService } from './bgs-in-game-timewarped-guardian.service';
import { BgsInGameTimewarpedService } from './bgs-in-game-timewarped.service';
import { BgsInGameTrinketsGuardianService } from './bgs-in-game-trinkets-guardian.service';
import { BgsInGameTrinketsService } from './bgs-in-game-trinkets.service';
import { BgsMetaCompositionStrategiesService } from './bgs-meta-composition-strategies.service';
import { BgsMetaHeroStrategiesService } from './bgs-meta-hero-strategies.service';
import { BgsMetaTrinketStrategiesService } from './bgs-meta-trinket-strategies.service';
import { BgsReconnectorService } from './bgs-reconnector.service';
import { BattlegroundsTrinketsService } from './bgs-trinkets.service';

@Injectable({ providedIn: 'root' })
export class BgsCommonBootstrapService {
	constructor(
		private readonly init_BattlegroundsTrinketsService: BattlegroundsTrinketsService,
		private readonly init_BattlegroundsCardsService: BattlegroundsCardsService,
		private readonly init_BattlegroundsCompsService: BattlegroundsCompsService,
		private readonly init_BgsInGameTrinketsGuardianService: BgsInGameTrinketsGuardianService,
		private readonly init_BgsInGameTrinketsService: BgsInGameTrinketsService,
		private readonly init_BgsInGameTimewarpedGuardianService: BgsInGameTimewarpedGuardianService,
		private readonly init_BgsInGameTimewarpedService: BgsInGameTimewarpedService,
		private readonly init_BgsMetaHeroStrategiesService: BgsMetaHeroStrategiesService,
		private readonly init_BgsMetaTrinketStrategiesService: BgsMetaTrinketStrategiesService,
		private readonly init_BgsMetaCompositionStrategiesService: BgsMetaCompositionStrategiesService,
		private readonly init_BgsBoardHighlighterService: BgsBoardHighlighterService,
		private readonly init_BgsReconnectorService: BgsReconnectorService,
	) { }
}
