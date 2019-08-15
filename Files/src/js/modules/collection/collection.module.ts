import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { init } from '@sentry/browser';
import { InlineSVGModule } from 'ng-inline-svg';
import { SelectModule } from 'ng-select';
import { AchievementImageComponent } from 'src/js/components/achievements/achievement-image.component';
import { AchievementProgressBarComponent } from 'src/js/components/achievements/achievement-progress-bar.component';
import { AchievementRecordingsComponent } from 'src/js/components/achievements/achievement-recordings.component';
import { FsOverlayPlay } from 'src/js/components/video-controls/play-overlay-double-click';
import { VgBufferingModule } from 'videogular2/buffering';
import { VgControlsModule } from 'videogular2/controls';
import { VgCoreModule } from 'videogular2/core';
import { VgOverlayPlayModule } from 'videogular2/overlay-play';
import { AchievementCompletionStepComponent } from '../../components/achievements/achievement-completion-step.component';
import { AchievementHistoryItemComponent } from '../../components/achievements/achievement-history-item.component';
import { AchievementHistoryComponent } from '../../components/achievements/achievement-history.component';
import { AchievementSetComponent } from '../../components/achievements/achievement-set.component';
import { AchievementSharingModal } from '../../components/achievements/achievement-sharing-modal.component';
import { AchievementSocialSharesComponent } from '../../components/achievements/achievement-social-shares.component';
import { AchievementThumbnailComponent } from '../../components/achievements/achievement-thumbnail.component';
import { AchievementViewComponent } from '../../components/achievements/achievement-view.component';
import { AchievementsCategoriesComponent } from '../../components/achievements/achievements-categories.component';
import { AchievementsGlobalCategoriesComponent } from '../../components/achievements/achievements-global-categories.component';
import { AchievementsGlobalCategoryComponent } from '../../components/achievements/achievements-global-category.component';
import { AchievementsListComponent } from '../../components/achievements/achievements-list.component';
import { AchievementsMenuComponent } from '../../components/achievements/achievements-menu.component';
import { AchievementsComponent } from '../../components/achievements/achievements.component';
import { CardHistoryItemComponent } from '../../components/collection/card-history-item.component';
import { CardHistoryComponent } from '../../components/collection/card-history.component';
import { CardSearchAutocompleteItemComponent } from '../../components/collection/card-search-autocomplete-item.component';
import { CardSearchComponent } from '../../components/collection/card-search.component';
import { CardComponent } from '../../components/collection/card.component';
import { CardsComponent } from '../../components/collection/cards.component';
import { CollectionEmptyStateComponent } from '../../components/collection/collection-empty-state.component';
import { CollectionMenuComponent } from '../../components/collection/collection-menu.component';
import { CollectionComponent } from '../../components/collection/collection.component';
import { FullCardComponent } from '../../components/collection/full-card.component';
import { RarityComponent } from '../../components/collection/rarity.component';
import { SetComponent } from '../../components/collection/set.component';
import { SetsContainer } from '../../components/collection/sets-container.component';
import { SetsComponent } from '../../components/collection/sets.component';
import { MainWindowNavigationComponent } from '../../components/controls/main-window-navigation.component';
import { DecktrackerComponent } from '../../components/decktracker/decktracker.component';
import { MainWindowComponent } from '../../components/main-window.component';
import { MenuSelectionComponent } from '../../components/menu-selection.component';
import { RealTimeNotificationsComponent } from '../../components/real-time-notifications.component';
import { ShareInfoComponent } from '../../components/sharing/share-info.component';
import { ShareLoginComponent } from '../../components/sharing/share-login.component';
import { FsTimeDisplay, FsUtcPipe } from '../../components/video-controls/single-minute-time.component';
import { AdService } from '../../services/ad.service';
import { RealTimeNotificationService } from '../../services/real-time-notifications.service';
import { SharedServicesModule } from '../shared-services/shared-services.module';
import { SharedModule } from '../shared/shared.module';

init({
	dsn: 'https://53b0813bb66246ae90c60442d05efefe@sentry.io/1338840',
	enabled: process.env.NODE_ENV === 'production',
	release: process.env.APP_VERSION,
});

console.log('version is ' + process.env.APP_VERSION);

@NgModule({
	imports: [
		BrowserModule,
		HttpClientModule,
		InlineSVGModule.forRoot(),
		BrowserAnimationsModule,
		FormsModule,
		OverlayModule,
		ReactiveFormsModule,
		SelectModule,
		SharedModule,
		VgCoreModule,
		VgControlsModule,
		VgOverlayPlayModule,
		VgBufferingModule,
		SharedServicesModule.forRoot(),
	],
	declarations: [
		MainWindowNavigationComponent,

		FsTimeDisplay,
		FsUtcPipe,
		FsOverlayPlay,

		CardComponent,
		CardHistoryComponent,
		CardHistoryItemComponent,
		CardsComponent,
		CardSearchComponent,
		CardSearchAutocompleteItemComponent,
		CollectionComponent,
		CollectionEmptyStateComponent,
		CollectionMenuComponent,
		FullCardComponent,
		MainWindowComponent,
		MenuSelectionComponent,
		RarityComponent,
		RealTimeNotificationsComponent,
		SetComponent,
		SetsComponent,
		SetsContainer,

		AchievementsComponent,
		AchievementCompletionStepComponent,
		AchievementsCategoriesComponent,
		AchievementsGlobalCategoriesComponent,
		AchievementsGlobalCategoryComponent,
		AchievementHistoryComponent,
		AchievementHistoryItemComponent,
		AchievementImageComponent,
		AchievementsListComponent,
		AchievementsMenuComponent,
		AchievementRecordingsComponent,
		AchievementSetComponent,
		AchievementProgressBarComponent,
		AchievementThumbnailComponent,
		AchievementViewComponent,
		AchievementSocialSharesComponent,
		AchievementSharingModal,

		DecktrackerComponent,

		ShareLoginComponent,
		ShareInfoComponent,
	],
	bootstrap: [MainWindowComponent],
	providers: [AdService, RealTimeNotificationService],
})
export class CollectionModule {}
