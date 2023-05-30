import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CollectionViewModule } from '@firestone/collection/view';
import { ProfileDataAccessModule } from '@firestone/profile/data-access';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { WebsiteBootstrapModule } from '@firestone/website/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { WebsiteProfileEffects } from './+state/website/profile.effects';
import * as fromWebsiteProfile from './+state/website/profile.reducer';
import { WebsiteProfileCollectionOverviewComponent } from './collection/website-profile-collection-overview.component';
import { WebsiteProfileCollectionComponent } from './collection/website-profile-collection.component';
import { WebsiteProfileSetsComponent } from './collection/website-profile-sets.component';
import { WebsiteProfileOverviewComponent } from './overview/website-profile-overview.component';
import { WebsiteProfileComponent } from './website-profile.component';

const components = [
	WebsiteProfileComponent,
	WebsiteProfileCollectionComponent,
	WebsiteProfileSetsComponent,
	WebsiteProfileOverviewComponent,
	WebsiteProfileCollectionOverviewComponent,
];

@NgModule({
	imports: [
		CommonModule,
		StoreModule.forFeature(fromWebsiteProfile.WEBSITE_PROFILE_FEATURE_KEY, fromWebsiteProfile.websiteDuelsReducer),
		EffectsModule.forFeature([WebsiteProfileEffects]),
		ProfileDataAccessModule,
		WebsiteBootstrapModule,
		SharedFrameworkCoreModule,
		CollectionViewModule,
	],
	declarations: components,
	exports: components,
})
export class WebsiteProfileModule {}
