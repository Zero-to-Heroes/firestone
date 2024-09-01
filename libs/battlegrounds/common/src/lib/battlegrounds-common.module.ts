import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ColiseumComponentsModule } from '@firestone-hs/coliseum-components';
import { BattlegroundsCoreModule } from '@firestone/battlegrounds/core';
import { BattlegroundsDataAccessModule } from '@firestone/battlegrounds/data-access';
import { BattlegroundsViewModule } from '@firestone/battlegrounds/view';
import { ConstructedCommonModule } from '@firestone/constructed/common';
import { MemoryModule } from '@firestone/memory';
import { ReplayColiseumModule } from '@firestone/replay/coliseum';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsCommonModule } from '@firestone/stats/common';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';
import { BgsLeaderboardsComponent } from './components/battlegrounds-leaderboards.component';
import { BgsBoardComponent } from './components/bgs-board.component';
import { BgsBuddiesComponent } from './components/bgs-buddies.component';
import { BgsHeroStatsInfoPremiumComponent } from './components/bgs-hero-stats-info-premium.component';
import { BgsOpponentOverviewBigComponent } from './components/bgs-opponent-overview-big.component';
import { BgsPlayerCapsuleComponent } from './components/bgs-player-capsule.component';
import { BgsQuestRewardsComponent } from './components/bgs-quest-rewards.component';
import { BgsTrinketsComponent } from './components/bgs-trinkets.component';
import { BgsTriplesComponent } from './components/bgs-triples.component';
import { BattlegroundsMetaStatsQuestsComponent } from './components/quests/battlegrounds-meta-stats-quests.component';
import { BgsQuestStatsInfoPremiumComponent } from './components/quests/bgs-quest-stats-info-premium.component';
import { BattlegroundsMetaStatsTrinketsComponent } from './components/trinkets/battlegrounds-meta-stats-trinkets.component';
import { BgsTrinketStatsInfoPremiumComponent } from './components/trinkets/bgs-trinket-stats-info-premium.component';
import { BgsCommonBootstrapService } from './services/_bgs-common-bootstrap.service';
import { BgsInGameHeroSelectionGuardianService } from './services/bgs-in-game-hero-selection-guardian.service';
import { BgsInGameQuestsGuardianService } from './services/bgs-in-game-quests-guardian.service';
import { BgsInGameQuestsService } from './services/bgs-in-game-quests.service';
import { BgsInGameTrinketsGuardianService } from './services/bgs-in-game-trinkets-guardian.service';
import { BgsInGameTrinketsService } from './services/bgs-in-game-trinkets.service';
import { BgsMatchMemoryInfoService } from './services/bgs-match-memory-info.service';
import { BgsMatchPlayersMmrService } from './services/bgs-match-players-mmr.service';
import { BgsMetaHeroStatsDuoService } from './services/bgs-meta-hero-stats-duo.service';
import { BgsMetaHeroStatsService } from './services/bgs-meta-hero-stats.service';
import { BattlegroundsNavigationService } from './services/bgs-navigation.service';
import { BattlegroundsOfficialLeaderboardService } from './services/bgs-official-leaderboards.service';
import { BgsPlayerHeroStatsService } from './services/bgs-player-hero-stats.service';
import { BattlegroundsQuestsService } from './services/bgs-quests.service';
import { BgsStateFacadeService } from './services/bgs-state-facade.service';
import { BattlegroundsTrinketsService } from './services/bgs-trinkets.service';

const components = [
	BgsQuestStatsInfoPremiumComponent,
	BgsLeaderboardsComponent,
	BgsHeroStatsInfoPremiumComponent,
	BgsBoardComponent,
	BgsTrinketStatsInfoPremiumComponent,
	BattlegroundsMetaStatsQuestsComponent,
	BattlegroundsMetaStatsTrinketsComponent,
	BgsTriplesComponent,
	BgsBuddiesComponent,
	BgsQuestRewardsComponent,
	BgsTrinketsComponent,
	BgsOpponentOverviewBigComponent,
	BgsPlayerCapsuleComponent,
];

@NgModule({
	imports: [
		CommonModule,

		VirtualScrollerModule,

		ReplayColiseumModule,
		ColiseumComponentsModule,

		SharedFrameworkCommonModule,
		SharedFrameworkCoreModule,
		SharedCommonViewModule,
		BattlegroundsDataAccessModule,
		BattlegroundsViewModule,
		BattlegroundsCoreModule,
		ConstructedCommonModule,
		MemoryModule,
		StatsCommonModule,
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
		BgsMatchMemoryInfoService,
		BattlegroundsOfficialLeaderboardService,
		BgsMatchPlayersMmrService,
		BgsStateFacadeService,
		BgsPlayerHeroStatsService,
		BgsMetaHeroStatsService,
		BgsMetaHeroStatsDuoService,
		BattlegroundsNavigationService,
		BgsInGameHeroSelectionGuardianService,
	],
	declarations: components,
	exports: components,
})
export class BattlegroundsCommonModule {}
