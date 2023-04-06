import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DuelsDataAccessModule } from '@firestone/duels/data-access';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { DuelsRankFilterDropdownViewComponent } from './filters/duels-rank-filter-dropdown-view.component';
import { DuelsTimeFilterDropdownViewComponent } from './filters/duels-time-filter-dropdown-view.component';
import { DuelsMetaStatsTierCardInfoComponent } from './stats/duels-meta-stats-tier-card-info.component';
import { DuelsMetaStatsTierTierComponent } from './stats/duels-meta-stats-tier.component';
import { DuelsMetaStatsViewComponent } from './stats/duels-meta-stats-view.component';

const components = [
	DuelsMetaStatsViewComponent,
	DuelsMetaStatsTierTierComponent,
	DuelsMetaStatsTierCardInfoComponent,
	DuelsRankFilterDropdownViewComponent,
	DuelsTimeFilterDropdownViewComponent,
];

@NgModule({
	imports: [CommonModule, SharedCommonViewModule, SharedFrameworkCoreModule, DuelsDataAccessModule],
	declarations: components,
	exports: components,
})
export class DuelsViewModule {}
