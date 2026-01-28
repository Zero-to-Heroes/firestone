import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AppCommonModule } from '@firestone/app/common';
import { AppViewModule } from '@firestone/app/view';
import { ArenaCommonModule } from '@firestone/arena/common';
import { ConstructedCommonModule } from '@firestone/constructed/common';
import { ConstructedViewModule } from '@firestone/constructed/view';
import { GameStateModule } from '@firestone/game-state';
import { MemoryModule } from '@firestone/memory';
import { ProfileCommonModule } from '@firestone/profile/common';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsCommonModule } from '@firestone/stats/common';
import { VirtualScrollerModule } from '@sebastientromp/ngx-virtual-scroller';
import { InlineSVGModule } from 'ng-inline-svg-2';

import { ArenaRewardComponent } from './components/arena-reward.component';
import { ArenaCardClassFilterDropdownComponent } from './components/card-stats/arena-card-class-filter-dropdown.component';
import { ArenaCardSearchComponent } from './components/card-stats/arena-card-search.component';
import { ArenaCardStatItemComponent } from './components/card-stats/arena-card-stat-item.component';
import { ArenaCardStatsComponent } from './components/card-stats/arena-card-stats.component';
import { ArenaCardTypeFilterDropdownComponent } from './components/card-stats/arena-card-type-filter-dropdown.component';
import { ArenaClassFilterDropdownComponent } from './components/card-stats/arena-class-filter-dropdown.component';
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
import { ArenaPackageCardSelectionWidgetWrapperComponent } from './components/overlays/arena-package-card-selection-widget-wrapper.component';
import { ArenaPackageCardSelectionComponent } from './components/overlays/arena-package-card-selection.component';
import { ArenaMulliganDeckComponent } from './components/overlays/mulligan/arena-mulligan-deck.component';
import { ArenaMulliganHandComponent } from './components/overlays/mulligan/arena-mulligan-hand.component';
import { ArenaPersonalStatsOverviewComponent } from './components/personal-stats/arena-personal-stats-overview.component';
import { ArenaPersonalStatsComponent } from './components/personal-stats/arena-personal-stats.component';
import { ArenaDeckDetailsComponent } from './components/runs/arena-deck-details.component';
import { ArenaRunVignetteComponent } from './components/runs/arena-run-vignette.component';
import { ArenaRunComponent } from './components/runs/arena-run.component';
import { ArenaCurrentSessionTooltipComponent } from './components/session/arena-current-session-tooltip.component';
import { ArenaCurrentSessionWidgetComponent } from './components/session/arena-current-session-widget.component';

const components = [
	ArenaClassTierListComponent,
	ArenaClassTierListTierComponent,
	ArenaClassInfoComponent,
	ArenaCardStatsComponent,
	ArenaCardStatItemComponent,
	ArenaCardSearchComponent,
	ArenaClassFilterDropdownComponent,
	ArenaCardClassFilterDropdownComponent,
	ArenaCardTypeFilterDropdownComponent,
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
	ArenaCurrentSessionWidgetComponent,
	ArenaCurrentSessionTooltipComponent,
	ArenaRunComponent,
	ArenaPackageCardSelectionWidgetWrapperComponent,
	ArenaPackageCardSelectionComponent,
];
@NgModule({
	imports: [
		CommonModule,

		InlineSVGModule,
		VirtualScrollerModule,

		SharedFrameworkCoreModule,
		SharedCommonViewModule,
		StatsCommonModule,
		ConstructedCommonModule,
		ConstructedViewModule,
		SharedFrameworkCommonModule,
		SharedCommonViewModule,
		SharedCommonServiceModule,
		MemoryModule,
		GameStateModule,
		AppViewModule,
		ProfileCommonModule,
		AppCommonModule,
		ArenaCommonModule,
	],
	providers: [],
	declarations: components,
	exports: components,
})
export class ArenaViewModule {}
