import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { init, Integrations } from '@sentry/browser';
import { CaptureConsole, ExtraErrorData } from '@sentry/integrations';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { InlineSVGModule } from 'ng-inline-svg';
import { SelectModule } from 'ng-select';
import { ChartsModule } from 'ng2-charts';
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
import { AchievementsFilterComponent } from '../../components/achievements/achievements-filter.component.ts';
import { AchievementsGlobalCategoriesComponent } from '../../components/achievements/achievements-global-categories.component';
import { AchievementsGlobalCategoryComponent } from '../../components/achievements/achievements-global-category.component';
import { AchievementsListComponent } from '../../components/achievements/achievements-list.component';
import { AchievementsComponent } from '../../components/achievements/achievements.component';
import { BgsCardTooltipComponent } from '../../components/battlegrounds/bgs-card-tooltip.component';
import { BattlegroundsCategoriesComponent } from '../../components/battlegrounds/desktop/battlegrounds-categories.component';
import { BattlegroundsCategoryDetailsComponent } from '../../components/battlegrounds/desktop/battlegrounds-category-details.component';
import { BattlegroundsCategoryComponent } from '../../components/battlegrounds/desktop/battlegrounds-category.component';
import { BattlegroundsDesktopComponent } from '../../components/battlegrounds/desktop/battlegrounds-desktop.component';
import { BattlegroundsFiltersComponent } from '../../components/battlegrounds/desktop/battlegrounds-filters.component';
import { BattlegroundsGlobalCategoriesComponent } from '../../components/battlegrounds/desktop/battlegrounds-global-categories.component';
import { BattlegroundsGlobalCategoryComponent } from '../../components/battlegrounds/desktop/battlegrounds-global-category.component';
import { BattlegroundsPersonalStatsHeroDetailsComponent } from '../../components/battlegrounds/desktop/categories/battlegrounds-personal-stats-hero-details.component';
import { BattlegroundsPersonalStatsHeroesComponent } from '../../components/battlegrounds/desktop/categories/battlegrounds-personal-stats-heroes.component';
import { BattlegroundsPersonalStatsRatingComponent } from '../../components/battlegrounds/desktop/categories/battlegrounds-personal-stats-rating.component';
import { BattlegroundsPersonalStatsStatsComponent } from '../../components/battlegrounds/desktop/categories/battlegrounds-personal-stats-stats.component';
import { BattlegroundsStatsHeroVignetteComponent } from '../../components/battlegrounds/desktop/categories/battlegrounds-stats-hero-vignette.component';
import { BgsLastWarbandsComponent } from '../../components/battlegrounds/desktop/categories/hero-details/bgs-last-warbands';
import { BgsMmrEvolutionForHeroComponent } from '../../components/battlegrounds/desktop/categories/hero-details/bgs-mmr-evolution-for-hero.component';
import { BgsWarbandStatsForHeroComponent } from '../../components/battlegrounds/desktop/categories/hero-details/bgs-warband-stats-for-hero.component';
import { BattlegroundsHeroRecordsBrokenComponent } from '../../components/battlegrounds/desktop/secondary/battlegrounds-hero-records-broken.component';
import { BattlegroundsHeroesRecordsBrokenComponent } from '../../components/battlegrounds/desktop/secondary/battlegrounds-heroes-records-broken.component';
import { BattlegroundsReplaysRecapComponent } from '../../components/battlegrounds/desktop/secondary/battlegrounds-replays-recap.component';
import { BattlegroundsTierListComponent } from '../../components/battlegrounds/desktop/secondary/battlegrounds-tier-list.component';
import { CardHistoryItemComponent } from '../../components/collection/card-history-item.component';
import { CardHistoryComponent } from '../../components/collection/card-history.component';
import { CardSearchAutocompleteItemComponent } from '../../components/collection/card-search-autocomplete-item.component';
import { CardSearchComponent } from '../../components/collection/card-search.component';
import { CardComponent } from '../../components/collection/card.component';
import { CardsComponent } from '../../components/collection/cards.component';
import { CollectionEmptyStateComponent } from '../../components/collection/collection-empty-state.component';
import { CollectionComponent } from '../../components/collection/collection.component';
import { FullCardComponent } from '../../components/collection/full-card.component';
import { RarityComponent } from '../../components/collection/rarity.component';
import { SetComponent } from '../../components/collection/set.component';
import { SetsContainer } from '../../components/collection/sets-container.component';
import { SetsComponent } from '../../components/collection/sets.component';
import { DecktrackerComponent } from '../../components/decktracker/decktracker.component';
import { DecktrackerDeckSummaryComponent } from '../../components/decktracker/main/decktracker-deck-summary.component';
import { DecktrackerDecksComponent } from '../../components/decktracker/main/decktracker-decks.component';
import { DecktrackerFiltersComponent } from '../../components/decktracker/main/decktracker-filters.component';
import { DecktrackerMenuComponent } from '../../components/decktracker/main/decktracker-menu.component';
import { MainWindowComponent } from '../../components/main-window.component';
import { FtueComponent } from '../../components/main-window/ftue/ftue.component';
import { GlobalHeaderComponent } from '../../components/main-window/global-header.component';
import { MenuSelectionComponent } from '../../components/menu-selection.component';
import { GameReplayComponent } from '../../components/replays/game-replay.component';
import { GroupedReplaysComponent } from '../../components/replays/grouped-replays.component';
import { MatchDetailsComponent } from '../../components/replays/match-details.component';
import { RankImageComponent } from '../../components/replays/rank-image.component';
import { ReplayInfoComponent } from '../../components/replays/replay-info.component';
import { ReplaysFilterComponent } from '../../components/replays/replays-filter.component';
import { ReplaysListComponent } from '../../components/replays/replays-list.component';
import { ReplaysComponent } from '../../components/replays/replays.component';
import { ShareInfoComponent } from '../../components/sharing/share-info.component';
import { ShareLoginComponent } from '../../components/sharing/share-login.component';
import { FsTimeDisplay, FsUtcPipe } from '../../components/video-controls/single-minute-time.component';
import { AdService } from '../../services/ad.service';
import { RealTimeNotificationService } from '../../services/real-time-notifications.service';
import { SharedServicesModule } from '../shared-services/shared-services.module';
import { SharedModule } from '../shared/shared.module';

init({
	dsn: 'https://53b0813bb66246ae90c60442d05efefe@o92856.ingest.sentry.io/1338840',
	enabled: process.env.NODE_ENV === 'production',
	release: process.env.APP_VERSION,
	attachStacktrace: true,
	sampleRate: 0.1,
	integrations: [
		new Integrations.GlobalHandlers({
			onerror: true,
			onunhandledrejection: true,
		}),
		new ExtraErrorData(),
		new CaptureConsole({
			levels: ['error'],
		}),
	],
});

console.log('version is ' + process.env.APP_VERSION);

@NgModule({
	imports: [
		BrowserModule,
		HttpClientModule,
		InlineSVGModule.forRoot(),
		BrowserAnimationsModule,
		SelectModule,
		FormsModule,
		ReactiveFormsModule,
		SharedModule,
		VgCoreModule,
		VgControlsModule,
		VgOverlayPlayModule,
		VgBufferingModule,
		ChartsModule,
		NgxChartsModule,
		SharedServicesModule.forRoot(),
	],
	declarations: [
		GlobalHeaderComponent,

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
		FullCardComponent,
		MainWindowComponent,
		MenuSelectionComponent,
		RarityComponent,
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
		AchievementRecordingsComponent,
		AchievementSetComponent,
		AchievementProgressBarComponent,
		AchievementThumbnailComponent,
		AchievementViewComponent,
		AchievementSocialSharesComponent,
		AchievementSharingModal,
		AchievementsFilterComponent,

		DecktrackerComponent,
		DecktrackerMenuComponent,
		DecktrackerDecksComponent,
		DecktrackerDeckSummaryComponent,
		DecktrackerFiltersComponent,

		ReplaysComponent,
		ReplaysListComponent,
		ReplaysFilterComponent,
		GroupedReplaysComponent,
		ReplayInfoComponent,
		MatchDetailsComponent,
		GameReplayComponent,
		RankImageComponent,

		BattlegroundsDesktopComponent,
		BattlegroundsFiltersComponent,
		BattlegroundsGlobalCategoriesComponent,
		BattlegroundsGlobalCategoryComponent,
		BattlegroundsCategoriesComponent,
		BattlegroundsCategoryComponent,
		BattlegroundsCategoryDetailsComponent,
		BattlegroundsPersonalStatsHeroesComponent,
		BattlegroundsStatsHeroVignetteComponent,
		BattlegroundsPersonalStatsRatingComponent,
		BattlegroundsPersonalStatsStatsComponent,
		BattlegroundsPersonalStatsHeroDetailsComponent,
		BattlegroundsTierListComponent,
		BattlegroundsHeroesRecordsBrokenComponent,
		BattlegroundsHeroRecordsBrokenComponent,
		BattlegroundsReplaysRecapComponent,
		BgsLastWarbandsComponent,
		BgsMmrEvolutionForHeroComponent,
		BgsWarbandStatsForHeroComponent,

		ShareLoginComponent,
		ShareInfoComponent,

		FtueComponent,
	],
	bootstrap: [MainWindowComponent],
	entryComponents: [BgsCardTooltipComponent],
	providers: [AdService, RealTimeNotificationService],
})
export class CollectionModule {}
