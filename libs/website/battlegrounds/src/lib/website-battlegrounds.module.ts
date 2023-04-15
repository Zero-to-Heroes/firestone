import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BattlegroundsDataAccessModule } from '@firestone/battlegrounds/data-access';
import { BattlegroundsViewModule } from '@firestone/battlegrounds/view';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { WebsiteBootstrapModule } from '@firestone/website/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { MetaHeroStatsEffects } from './+state/meta-hero-stats/meta-hero-stats.effects';
import * as fromWebsiteBattlegrounds from './+state/meta-hero-stats/meta-hero-stats.reducer';
import { WebsiteBattlegroundsRankFilterDropdownComponent } from './website-battlegrounds-rank-filter-dropdown.component';
import { WebsiteBattlegroundsTimeFilterDropdownComponent } from './website-battlegrounds-time-filter-dropdown.component';
import { WebsiteBattlegroundsTribesFilterDropdownComponent } from './website-battlegrounds-tribes-filter-dropdown.component';
import { WebsiteBattlegroundsComponent } from './website-battlegrounds.component';

const components = [
	WebsiteBattlegroundsComponent,
	WebsiteBattlegroundsRankFilterDropdownComponent,
	WebsiteBattlegroundsTimeFilterDropdownComponent,
	WebsiteBattlegroundsTribesFilterDropdownComponent,
];

@NgModule({
	imports: [
		CommonModule,
		StoreModule.forFeature(
			fromWebsiteBattlegrounds.WEBSITE_BGS_META_HERO_STATS_FEATURE_KEY,
			fromWebsiteBattlegrounds.metaHeroStatsStateReducer,
		),
		EffectsModule.forFeature([MetaHeroStatsEffects]),

		WebsiteBootstrapModule,
		SharedFrameworkCommonModule,
		SharedFrameworkCoreModule,
		BattlegroundsDataAccessModule,
		BattlegroundsViewModule,
	],
	declarations: components,
	exports: components,
})
export class WebsiteBattlegroundsModule {}
