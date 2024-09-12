import { Injectable } from '@angular/core';
import { BgsInGameTrinketsGuardianService } from './bgs-in-game-trinkets-guardian.service';
import { BgsInGameTrinketsService } from './bgs-in-game-trinkets.service';
import { BgsMetaHeroStrategiesService } from './bgs-meta-hero-strategies.service';
import { BattlegroundsTrinketsService } from './bgs-trinkets.service';

@Injectable()
export class BgsCommonBootstrapService {
	constructor(
		private readonly init_BattlegroundsTrinketsService: BattlegroundsTrinketsService,
		private readonly init_BgsInGameTrinketsGuardianService: BgsInGameTrinketsGuardianService,
		private readonly init_BgsInGameTrinketsService: BgsInGameTrinketsService,
		private readonly init_BgsMetaHeroStrategiesService: BgsMetaHeroStrategiesService,
	) {}
}
