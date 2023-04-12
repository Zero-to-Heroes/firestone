import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { BgsHeroPortraitComponent } from './common/bgs-hero-portrait.component';
import { BattlegroundsRankFilterDropdownViewComponent } from './filters/battlegrounds-rank-filter-dropdown-view.component';
import { BattlegroundsTimeFilterDropdownViewComponent } from './filters/battlegrounds-time-filter-dropdown-view.component';
import { BattlegroundsTribesFilterDropdownViewComponent } from './filters/battlegrounds-tribes-filter-dropdown-view.component';
import { BattlegroundsMetaStatsHeroInfoComponent } from './meta-heroes/battlegrounds-meta-stats-hero-info.component';
import { BattlegroundsMetaStatsHeroTierComponent } from './meta-heroes/battlegrounds-meta-stats-hero-tier.component';
import { BattlegroundsMetaStatsHeroesViewComponent } from './meta-heroes/battlegrounds-meta-stats-heroes-view.component';

const components = [
	BattlegroundsMetaStatsHeroesViewComponent,
	BattlegroundsMetaStatsHeroTierComponent,
	BattlegroundsMetaStatsHeroInfoComponent,
	BgsHeroPortraitComponent,

	BattlegroundsRankFilterDropdownViewComponent,
	BattlegroundsTimeFilterDropdownViewComponent,
	BattlegroundsTribesFilterDropdownViewComponent,
];

@NgModule({
	imports: [CommonModule, SharedCommonViewModule, SharedFrameworkCoreModule],
	declarations: components,
	exports: components,
})
export class BattlegroundsViewModule {}
