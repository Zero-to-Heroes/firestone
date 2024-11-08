import { Injectable } from '@angular/core';
import { BgsBoardHighlighterService } from '../highlights/bgs-board-highlighter.service';
import { BgsInGameTrinketsGuardianService } from './bgs-in-game-trinkets-guardian.service';
import { BgsInGameTrinketsService } from './bgs-in-game-trinkets.service';
import { BgsMetaCompositionStrategiesService } from './bgs-meta-composition-strategies.service';
import { BgsMetaHeroStrategiesService } from './bgs-meta-hero-strategies.service';
import { BgsMetaTrinketStrategiesService } from './bgs-meta-trinket-strategies.service';
import { BattlegroundsTrinketsService } from './bgs-trinkets.service';

@Injectable()
export class BgsCommonBootstrapService {
	constructor(
		private readonly init_BattlegroundsTrinketsService: BattlegroundsTrinketsService,
		private readonly init_BgsInGameTrinketsGuardianService: BgsInGameTrinketsGuardianService,
		private readonly init_BgsInGameTrinketsService: BgsInGameTrinketsService,
		private readonly init_BgsMetaHeroStrategiesService: BgsMetaHeroStrategiesService,
		private readonly init_BgsMetaTrinketStrategiesService: BgsMetaTrinketStrategiesService,
		private readonly init_BgsMetaCompositionStrategiesService: BgsMetaCompositionStrategiesService,
		private readonly init_BgsBoardHighlighterService: BgsBoardHighlighterService,
	) {}
}
