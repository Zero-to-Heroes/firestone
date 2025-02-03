import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ConstructedCommonModule } from '@firestone/constructed/common';
import { GameStateModule } from '@firestone/game-state';
import { MemoryModule } from '@firestone/memory';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsCommonModule } from '@firestone/stats/common';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';
import { ArenaRewardComponent } from './components/arena-reward.component';
import { ArenaCardSearchComponent } from './components/card-stats/arena-card-search.component';
import { ArenaCardStatItemComponent } from './components/card-stats/arena-card-stat-item.component';
import { ArenaCardStatsComponent } from './components/card-stats/arena-card-stats.component';
import { ArenaClassInfoComponent } from './components/class-info/arena-class-info.component';
import { ArenaClassTierListTierComponent } from './components/class-info/arena-class-tier-list-tier.component';
import { ArenaClassTierListComponent } from './components/class-info/arena-class-tier-list.component';
import { ArenaHighWinsCardSearchComponent } from './components/filters/arena-high-wins-card-search.component';
import { ArenaHighWinsRunsComponent } from './components/high-wins-runs/arena-high-wins-runs.component';
import { ArenaCardOptionViewComponent } from './components/overlays/arena-card-option-view.component';
import { ArenaCardOptionComponent } from './components/overlays/arena-card-option.component';
import { ArenaCardSelectionComponent } from './components/overlays/arena-card-selection.component';
import { ArenaHeroOptionComponent } from './components/overlays/arena-hero-option.component';
import { ArenaHeroSelectionComponent } from './components/overlays/arena-hero-selection.component';
import { ArenaOptionInfoPremiumComponent } from './components/overlays/arena-option-info-premium.component';
import { ArenaMulliganDeckComponent } from './components/overlays/mulligan/arena-mulligan-deck.component';
import { ArenaMulliganHandComponent } from './components/overlays/mulligan/arena-mulligan-hand.component';
import { ArenaPersonalStatsOverviewComponent } from './components/personal-stats/arena-personal-stats-overview.component';
import { ArenaPersonalStatsComponent } from './components/personal-stats/arena-personal-stats.component';
import { ArenaDeckDetailsComponent } from './components/runs/arena-deck-details.component';
import { ArenaRunVignetteComponent } from './components/runs/arena-run-vignette.component';
import { ArenaCardStatsService } from './services/arena-card-stats.service';
import { ArenaClassStatsService } from './services/arena-class-stats.service';
import { ArenDeckDetailsService } from './services/arena-deck-details.service';
import { ArenaDeckStatsService } from './services/arena-deck-stats.service';
import { ArenaDiscoversGuardianService } from './services/arena-discovers-guardian.service';
import { ArenaHighWinsRunsService } from './services/arena-high-wins-runs.service';
import { ArenaInfoService } from './services/arena-info.service';
import { ArenaMulliganGuideGuardianService } from './services/arena-mulligan-guide-guardian.service';
import { ArenaMulliganGuideService } from './services/arena-mulligan-guide.service';
import { ArenaNavigationService } from './services/arena-navigation.service';
import { ArenaRewardsService } from './services/arena-rewards.service';
import { ArenaRunsService } from './services/arena-runs.service';

const components = [
	ArenaClassTierListComponent,
	ArenaClassTierListTierComponent,
	ArenaClassInfoComponent,
	ArenaCardStatsComponent,
	ArenaCardStatItemComponent,
	ArenaCardSearchComponent,
	ArenaHeroSelectionComponent,
	ArenaHeroOptionComponent,
	ArenaCardSelectionComponent,
	ArenaCardOptionComponent,
	ArenaCardOptionViewComponent,
	ArenaOptionInfoPremiumComponent,
	ArenaDeckDetailsComponent,
	ArenaHighWinsRunsComponent,
	ArenaRunVignetteComponent,
	ArenaMulliganDeckComponent,
	ArenaMulliganHandComponent,
	ArenaPersonalStatsComponent,
	ArenaPersonalStatsOverviewComponent,
	ArenaHighWinsCardSearchComponent,
	ArenaRewardComponent,
];
@NgModule({
	imports: [
		CommonModule,

		VirtualScrollerModule,
		InlineSVGModule.forRoot(),

		SharedFrameworkCoreModule,
		SharedCommonViewModule,
		StatsCommonModule,
		ConstructedCommonModule,
		SharedFrameworkCommonModule,
		SharedCommonViewModule,
		SharedCommonServiceModule,
		MemoryModule,
		GameStateModule,
	],
	providers: [
		ArenaClassStatsService,
		ArenaCardStatsService,
		ArenaNavigationService,
		ArenDeckDetailsService,
		ArenaHighWinsRunsService,
		ArenaMulliganGuideService,
		ArenaMulliganGuideGuardianService,
		ArenaDiscoversGuardianService,
		ArenaDeckStatsService,
		ArenaRunsService,
		ArenaInfoService,
		ArenaRewardsService,
	],
	declarations: components,
	exports: components,
})
export class ArenaCommonModule {}
