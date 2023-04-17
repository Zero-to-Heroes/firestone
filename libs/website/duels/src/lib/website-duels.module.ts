import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DuelsDataAccessModule } from '@firestone/duels/data-access';
import { DuelsViewModule } from '@firestone/duels/view';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { WebsiteDuelsEffects } from './+state/website/duels.effects';
import * as fromWebsiteDuels from './+state/website/duels.reducer';
import { WebsiteDuelsHeroFilterDropdownComponent } from './filters/website-duels-hero-filter-dropdown.component';
import { WebsiteDuelsHeroPowerFilterDropdownComponent } from './filters/website-duels-hero-power-filter-dropdown.component';
import { WebsiteDuelsRankFilterDropdownComponent } from './filters/website-duels-rank-filter-dropdown.component';
import { WebsiteDuelsSignatureFilterDropdownComponent } from './filters/website-duels-signature-filter-dropdown.component';
import { WebsiteDuelsTimeFilterDropdownComponent } from './filters/website-duels-time-filter-dropdown.component';
import { WebsiteDuelsActiveTreasuresComponent } from './website-duels-active-treasures.component';
import { WebsiteDuelsHeroPowersComponent } from './website-duels-hero-powers.component';
import { WebsiteDuelsHeroesComponent } from './website-duels-heroes.component';
import { WebsiteDuelsPassiveTreasuresComponent } from './website-duels-passive-treasures.component';
import { WebsiteDuelsSignatureTreasuresComponent } from './website-duels-signature-treasures.component';

const components = [
	WebsiteDuelsHeroesComponent,
	WebsiteDuelsHeroPowersComponent,
	WebsiteDuelsSignatureTreasuresComponent,
	WebsiteDuelsRankFilterDropdownComponent,
	WebsiteDuelsTimeFilterDropdownComponent,
	WebsiteDuelsHeroFilterDropdownComponent,
	WebsiteDuelsHeroPowerFilterDropdownComponent,
	WebsiteDuelsSignatureFilterDropdownComponent,
	WebsiteDuelsPassiveTreasuresComponent,
	WebsiteDuelsActiveTreasuresComponent,
];

@NgModule({
	imports: [
		CommonModule,
		StoreModule.forFeature(fromWebsiteDuels.WEBSITE_DUELS_FEATURE_KEY, fromWebsiteDuels.websiteDuelsReducer),
		EffectsModule.forFeature([WebsiteDuelsEffects]),

		SharedFrameworkCoreModule,

		DuelsViewModule,
		DuelsDataAccessModule,
	],
	declarations: components,
	exports: components,
})
export class WebsiteDuelsModule {}
