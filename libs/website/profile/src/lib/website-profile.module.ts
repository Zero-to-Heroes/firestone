import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AchievementsDataAccessModule } from '@firestone/achievements/data-access';
import { AchievementsViewModule } from '@firestone/achievements/view';
import { CollectionViewModule } from '@firestone/collection/view';
import { ProfileDataAccessModule } from '@firestone/profile/data-access';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { WebsiteBootstrapModule } from '@firestone/website/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { WebsiteProfileEffects } from './+state/website/profile.effects';
import * as fromWebsiteProfile from './+state/website/profile.reducer';
import { WebsiteProfileAchievementsOverviewComponent } from './achievements/website-profile-achievements-overview.component';
import { WebsiteProfileAchievementsComponent } from './achievements/website-profile-achievements.component';
import { WebsiteProfileCollectionOverviewComponent } from './collection/website-profile-collection-overview.component';
import { WebsiteProfileCollectionComponent } from './collection/website-profile-collection.component';
import { WebsiteProfileSetsComponent } from './collection/website-profile-sets.component';
import { WebsiteProfileOverviewComponent } from './overview/website-profile-overview.component';
import { WebsiteProfileShareModalComponent } from './share/website-profile-share-modal.component';
import { WebsiteProfileComponent } from './website-profile.component';

const components = [
	WebsiteProfileComponent,
	WebsiteProfileCollectionComponent,
	WebsiteProfileSetsComponent,
	WebsiteProfileOverviewComponent,
	WebsiteProfileCollectionOverviewComponent,
	WebsiteProfileShareModalComponent,
	WebsiteProfileAchievementsComponent,
	WebsiteProfileAchievementsOverviewComponent,
];

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		ClipboardModule,

		InlineSVGModule.forRoot(),

		StoreModule.forFeature(fromWebsiteProfile.WEBSITE_PROFILE_FEATURE_KEY, fromWebsiteProfile.websiteDuelsReducer),
		EffectsModule.forFeature([WebsiteProfileEffects]),

		WebsiteBootstrapModule,
		ProfileDataAccessModule,
		SharedFrameworkCoreModule,
		CollectionViewModule,
		AchievementsViewModule,
		AchievementsDataAccessModule,
	],
	declarations: components,
	exports: components,
})
export class WebsiteProfileModule {}
