import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BattlegroundsCoreModule } from '@firestone/battlegrounds/core';
import { BattlegroundsDataAccessModule } from '@firestone/battlegrounds/data-access';
import { BattlegroundsViewModule } from '@firestone/battlegrounds/view';
import { ConstructedCommonModule } from '@firestone/constructed/common';
import { MemoryModule } from '@firestone/memory';
import { ProfileCommonModule } from '@firestone/profile/common';
import { ReplayColiseumModule } from '@firestone/replay/coliseum';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsCommonModule } from '@firestone/stats/common';
import { StatsServicesModule } from '@firestone/stats/services';
import { VirtualScrollerModule } from '@sebastientromp/ngx-virtual-scroller';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { BattlegroundsMetaStatsCardsComponent } from './cards/battlegrounds-meta-stats-cards.component';
import { BgsLeaderboardsComponent } from './components/battlegrounds-leaderboards.component';
import { BattleStatusPremiumComponent } from './components/battles/battle-status-premium.component';
import { BgsBattleRecapPlayerComponent } from './components/battles/bgs-battle-recap-player.component';
import { BgsBattleRecapComponent } from './components/battles/bgs-battle-recap.component';
import { BgsBattleStatusComponent } from './components/battles/bgs-battle-status.component';
import { BgsBoardComponent } from './components/bgs-board.component';
import { BgsBuddiesComponent } from './components/bgs-buddies.component';
import { BgsCardTooltipComponent } from './components/bgs-card-tooltip.component';
import { BgsHeroStatsInfoPremiumComponent } from './components/bgs-hero-stats-info-premium.component';
import { BgsOpponentOverviewBigComponent } from './components/bgs-opponent-overview-big.component';
import { BgsPlayerCapsuleComponent } from './components/bgs-player-capsule.component';
import { BgsQuestRewardsComponent } from './components/bgs-quest-rewards.component';
import { BgsSimulationOverlayComponent } from './components/bgs-simulation-overlay.component';
import { BgsTrinketsComponent } from './components/bgs-trinkets.component';
import { BgsTriplesComponent } from './components/bgs-triples.component';
import { BattlegroundsMetaStatsQuestsComponent } from './components/quests/battlegrounds-meta-stats-quests.component';
import { BgsQuestStatsInfoPremiumComponent } from './components/quests/bgs-quest-stats-info-premium.component';
import { BgsStrategiesViewComponent } from './components/strategies/bgs-strategies-view.component';
import { BgsStrategyCurveComponent } from './components/strategies/bgs-strategy-curve.component';
import { BgsTrinketStrategiesWrapperComponent } from './components/strategies/bgs-trinket-strategies-wrapper.component';
import { BgsTrinketStrategyTipsTooltipComponent } from './components/strategies/bgs-trinket-strategy-tips-tooltip.component';
import { BattlegroundsMetaStatsTrinketsComponent } from './components/trinkets/battlegrounds-meta-stats-trinkets.component';
import { BgsTrinketStatsInfoPremiumComponent } from './components/trinkets/bgs-trinket-stats-info-premium.component';
import { BattlegroundsMetaStatsCompsComponent } from './compositions/battlegrounds-meta-stats-comps.component';
import { BattlegroundsCompositionsViewSelectDropdownComponent } from './compositions/bgs-comps-view-select-dropdown';
import { BgsReconnectorComponent } from './reconnect/bgs-reconnector.component';

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
	BgsSimulationOverlayComponent,
	BgsStrategiesViewComponent,
	BgsStrategyCurveComponent,
	BgsTrinketStrategiesWrapperComponent,
	BgsTrinketStrategyTipsTooltipComponent,
	BgsBattleRecapPlayerComponent,
	BgsBattleRecapComponent,
	BattlegroundsCompositionsViewSelectDropdownComponent,
	BattlegroundsMetaStatsCardsComponent,
	BattlegroundsMetaStatsCompsComponent,
	BgsReconnectorComponent,
	BattleStatusPremiumComponent,
	BgsBattleStatusComponent,
	BgsCardTooltipComponent,
];

@NgModule({
	imports: [
		CommonModule,
		OverlayModule,

		VirtualScrollerModule,
		InlineSVGModule,

		ReplayColiseumModule,
		// ColiseumComponentsModule,

		SharedFrameworkCommonModule,
		SharedFrameworkCoreModule,
		SharedCommonViewModule,
		BattlegroundsDataAccessModule,
		BattlegroundsViewModule,
		BattlegroundsCoreModule,
		ConstructedCommonModule,
		MemoryModule,
		StatsCommonModule,
		ProfileCommonModule,
		StatsServicesModule,
	],
	providers: [],
	declarations: components,
	exports: components,
})
export class BattlegroundsCommonModule { }
