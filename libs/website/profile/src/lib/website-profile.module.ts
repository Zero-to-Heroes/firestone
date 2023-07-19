import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AchievementsDataAccessModule } from '@firestone/achievements/data-access';
import { AchievementsViewModule } from '@firestone/achievements/view';
import { BattlegroundsViewModule } from '@firestone/battlegrounds/view';
import { CollectionViewModule } from '@firestone/collection/view';
import { ProfileDataAccessModule } from '@firestone/profile/data-access';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { WebsiteBootstrapModule } from '@firestone/website/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { WebsiteProfileEffects } from './+state/website/profile.effects';
import * as fromWebsiteProfile from './+state/website/profile.reducer';
import { WebsiteProfileAchievementsOverviewComponent } from './achievements/website-profile-achievements-overview.component';
import { WebsiteProfileAchievementsComponent } from './achievements/website-profile-achievements.component';
import { WebsiteProfileArenaOverviewsComponent } from './arena/website-profile-arena-overviews.component';
import { WebsiteProfileArenaComponent } from './arena/website-profile-arena.component';
import { WebsiteProfileBattlegroundsHeroStatVignetteComponent } from './battlegrounds/website-profile-battlegrounds-hero-stat-vignette.component';
import { WebsiteProfileBattlegroundsOverviewComponent } from './battlegrounds/website-profile-battlegrounds-overview.component';
import { WebsiteProfileBattlegroundsOverviewsComponent } from './battlegrounds/website-profile-battlegrounds-overviews.component';
import { WebsiteProfileBattlegroundsComponent } from './battlegrounds/website-profile-battlegrounds.component';
import { WebsiteProfileCollectionOverviewComponent } from './collection/website-profile-collection-overview.component';
import { WebsiteProfileCollectionComponent } from './collection/website-profile-collection.component';
import { WebsiteProfileSetsComponent } from './collection/website-profile-sets.component';
import { WebsiteProfileDuelsOverviewsComponent } from './duels/website-profile-duels-overviews.component';
import { WebsiteProfileDuelsComponent } from './duels/website-profile-duels.component';
import { WebsiteProfileClassStatComponent } from './modes/website-profile-class-stat.component';
import { WebsiteProfileClassStatsComponent } from './modes/website-profile-class-stats.component';
import { WebsiteProfileModeOverviewComponent } from './modes/website-profile-mode-overview.component';
import { WebsiteProfileOverviewComponent } from './overview/website-profile-overview.component';
import { WebsiteProfilePacksOverviewComponent } from './packs/website-profile-packs-overview.component';
import { WebsiteProfilePacksComponent } from './packs/website-profile-packs.component';
import { WebsiteProfileRankedOverviewsComponent } from './ranked/website-profile-ranked-overviews.component';
import { WebsiteProfileRankedComponent } from './ranked/website-profile-ranked.component';
import { WebsiteProfileShareModalComponent } from './share/website-profile-share-modal.component';
import { WebsiteProfileComponent } from './website-profile.component';

const components = [
	WebsiteProfileComponent,
	WebsiteProfileCollectionComponent,
	WebsiteProfileSetsComponent,
	WebsiteProfileOverviewComponent,
	WebsiteProfileCollectionOverviewComponent,
	WebsiteProfilePacksComponent,
	WebsiteProfilePacksOverviewComponent,
	WebsiteProfileShareModalComponent,
	WebsiteProfileAchievementsComponent,
	WebsiteProfileAchievementsOverviewComponent,
	WebsiteProfileBattlegroundsComponent,
	WebsiteProfileBattlegroundsHeroStatVignetteComponent,
	WebsiteProfileBattlegroundsOverviewComponent,
	WebsiteProfileBattlegroundsOverviewsComponent,
	WebsiteProfileModeOverviewComponent,
	WebsiteProfileRankedComponent,
	WebsiteProfileRankedOverviewsComponent,
	WebsiteProfileDuelsComponent,
	WebsiteProfileDuelsOverviewsComponent,
	WebsiteProfileArenaComponent,
	WebsiteProfileArenaOverviewsComponent,
	WebsiteProfileClassStatsComponent,
	WebsiteProfileClassStatComponent,
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

		SharedFrameworkCoreModule,
		SharedCommonViewModule,
		WebsiteBootstrapModule,
		ProfileDataAccessModule,
		CollectionViewModule,
		AchievementsViewModule,
		AchievementsDataAccessModule,
		BattlegroundsViewModule,
	],
	declarations: components,
	exports: components,
})
export class WebsiteProfileModule {}
