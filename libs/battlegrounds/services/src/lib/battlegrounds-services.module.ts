import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BattlegroundsCoreModule } from '@firestone/battlegrounds/core';
import { BattlegroundsDataAccessModule } from '@firestone/battlegrounds/data-access';
import { GameStateModule } from '@firestone/game-state';
import { MemoryModule } from '@firestone/memory';
import { ProfileCommonModule } from '@firestone/profile/common';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { BgsCommonBootstrapService } from './services/_bgs-common-bootstrap.service';
import { BgsBoardHighlighterService } from './services/bgs-board-highlighter.service';
import { BattlegroundsCardsService } from './services/bgs-cards.service';
import { BattlegroundsCompsService } from './services/bgs-comps.service';
import { BgsInGameCompositionsService } from './services/bgs-in-game-compositions.service';
import { BgsInGameHeroSelectionGuardianService } from './services/bgs-in-game-hero-selection-guardian.service';
import { BgsInGameQuestsGuardianService } from './services/bgs-in-game-quests-guardian.service';
import { BgsInGameQuestsService } from './services/bgs-in-game-quests.service';
import { BgsInGameTrinketsGuardianService } from './services/bgs-in-game-trinkets-guardian.service';
import { BgsInGameTrinketsService } from './services/bgs-in-game-trinkets.service';
import { BgsInGameWindowNavigationService } from './services/bgs-in-game-window-navigation.service';
import { BgsMetaCompositionStrategiesService } from './services/bgs-meta-composition-strategies.service';
import { BgsMetaHeroStatsDuoService } from './services/bgs-meta-hero-stats-duo.service';
import { BgsMetaHeroStatsService } from './services/bgs-meta-hero-stats.service';
import { BgsMetaHeroStrategiesService } from './services/bgs-meta-hero-strategies.service';
import { BgsMetaTrinketStrategiesService } from './services/bgs-meta-trinket-strategies.service';
import { BattlegroundsNavigationService } from './services/bgs-navigation.service';
import { BgsPlayerHeroStatsService } from './services/bgs-player-hero-stats.service';
import { BattlegroundsQuestsService } from './services/bgs-quests.service';
import { BattlegroundsTrinketsService } from './services/bgs-trinkets.service';

@NgModule({
	imports: [
		CommonModule,

		SharedCommonServiceModule,
		SharedFrameworkCommonModule,
		SharedFrameworkCoreModule,
		BattlegroundsDataAccessModule,
		BattlegroundsCoreModule,
		GameStateModule,
		MemoryModule,
		StatsDataAccessModule,
		ProfileCommonModule,
	],
	providers: [
		BgsCommonBootstrapService,
		BattlegroundsTrinketsService,
		BgsInGameTrinketsGuardianService,
		BgsInGameTrinketsService,
		BattlegroundsQuestsService,
		BgsInGameQuestsService,
		BgsInGameQuestsGuardianService,
		BgsInGameHeroSelectionGuardianService,
		BgsPlayerHeroStatsService,
		BgsMetaHeroStatsService,
		BgsMetaHeroStatsDuoService,
		BattlegroundsNavigationService,
		BgsInGameHeroSelectionGuardianService,
		BgsMetaHeroStrategiesService,
		BgsMetaTrinketStrategiesService,
		BgsMetaCompositionStrategiesService,
		BgsInGameCompositionsService,
		BgsBoardHighlighterService,
		BattlegroundsCardsService,
		BattlegroundsCompsService,
		BgsInGameWindowNavigationService,
	],
})
export class BattlegroundsServicesModule { }
