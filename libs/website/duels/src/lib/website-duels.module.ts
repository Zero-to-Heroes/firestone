import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DuelsDataAccessModule } from '@firestone/duels/data-access';
import { DuelsViewModule } from '@firestone/duels/view';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { WebsiteDuelsEffects } from './+state/website/duels.effects';
import * as fromWebsiteDuels from './+state/website/duels.reducer';
import { WebsiteDuelsComponent } from './website-duels.component';

const components = [WebsiteDuelsComponent];

@NgModule({
	imports: [
		CommonModule,
		StoreModule.forFeature(fromWebsiteDuels.WEBSITE_DUELS_FEATURE_KEY, fromWebsiteDuels.websiteDuelsReducer),
		EffectsModule.forFeature([WebsiteDuelsEffects]),

		DuelsViewModule,
		DuelsDataAccessModule,
	],
	declarations: components,
	exports: components,
})
export class WebsiteDuelsModule {}
