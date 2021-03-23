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
import { DuelsReplaysRecapForRunComponent } from 'src/js/components/duels/desktop/secondary/duels-replays-recap-for-run.component';
import { FsOverlayPlay } from 'src/js/components/video-controls/play-overlay-double-click';
import { VgBufferingModule } from 'videogular2/buffering';
import { VgControlsModule } from 'videogular2/controls';
import { VgCoreModule } from 'videogular2/core';
import { VgOverlayPlayModule } from 'videogular2/overlay-play';
import { AchievementCategoryComponent } from '../../components/achievements/achievement-category.component';
import { AchievementCompletionStepComponent } from '../../components/achievements/achievement-completion-step.component';
import { AchievementHistoryItemComponent } from '../../components/achievements/achievement-history-item.component';
import { AchievementHistoryComponent } from '../../components/achievements/achievement-history.component';
import { AchievementViewComponent } from '../../components/achievements/achievement-view.component';
import { AchievementsCategoriesComponent } from '../../components/achievements/achievements-categories.component';
import { AchievementsFilterComponent } from '../../components/achievements/achievements-filter.component.ts';
import { AchievementsListComponent } from '../../components/achievements/achievements-list.component';
import { AchievementsComponent } from '../../components/achievements/achievements.component';
import { BattlegroundsEmptyStateComponent } from '../../components/battlegrounds/battlegrounds-empty-state.component';
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
import {
	BgsGlobalValueComponent,
	BgsHeroDetailedStatsComponent,
} from '../../components/battlegrounds/desktop/categories/hero-details/bgs-hero-detailed-stats.component';
import { BgsLastWarbandsComponent } from '../../components/battlegrounds/desktop/categories/hero-details/bgs-last-warbands.component';
import { BgsMmrEvolutionForHeroComponent } from '../../components/battlegrounds/desktop/categories/hero-details/bgs-mmr-evolution-for-hero.component';
import { BgsWarbandStatsForHeroComponent } from '../../components/battlegrounds/desktop/categories/hero-details/bgs-warband-stats-for-hero.component';
import { BgsWinrateStatsForHeroComponent } from '../../components/battlegrounds/desktop/categories/hero-details/bgs-winrate-stats-for-hero.component';
import { BattlegroundsHeroRecordsBrokenComponent } from '../../components/battlegrounds/desktop/secondary/battlegrounds-hero-records-broken.component';
import { BattlegroundsHeroesRecordsBrokenComponent } from '../../components/battlegrounds/desktop/secondary/battlegrounds-heroes-records-broken.component';
import { BattlegroundsReplaysRecapComponent } from '../../components/battlegrounds/desktop/secondary/battlegrounds-replays-recap.component';
import { BattlegroundsTierListComponent } from '../../components/battlegrounds/desktop/secondary/battlegrounds-tier-list.component';
import { CardBackComponent } from '../../components/collection/card-back.component';
import { CardBacksComponent } from '../../components/collection/card-backs.component';
import { CardHistoryItemComponent } from '../../components/collection/card-history-item.component';
import { CardHistoryComponent } from '../../components/collection/card-history.component';
import { CardSearchAutocompleteItemComponent } from '../../components/collection/card-search-autocomplete-item.component';
import { CardSearchComponent } from '../../components/collection/card-search.component';
import { CardComponent } from '../../components/collection/card.component';
import { CardsComponent } from '../../components/collection/cards.component';
import { CollectionEmptyStateComponent } from '../../components/collection/collection-empty-state.component';
import { CollectionMenuSelectionComponent } from '../../components/collection/collection-menu-selection.component';
import { CollectionComponent } from '../../components/collection/collection.component';
import { OwnedFilterComponent } from '../../components/collection/filters/owned-filter.component';
import { FullCardBackComponent } from '../../components/collection/full-card-back.component';
import { FullCardComponent } from '../../components/collection/full-card.component';
import { HeroPortraitComponent } from '../../components/collection/hero-portrait.component';
import { HeroPortraitsComponent } from '../../components/collection/hero-portraits.component';
import { CollectionPackStatsComponent } from '../../components/collection/pack-stats.component';
import { RarityComponent } from '../../components/collection/rarity.component';
import { SetStatCellComponent } from '../../components/collection/set-stat-cell.component';
import { SetStatsComponent } from '../../components/collection/set-stats.component';
import { SetComponent } from '../../components/collection/set.component';
import { SetsContainer } from '../../components/collection/sets-container.component';
import { SetsComponent } from '../../components/collection/sets.component';
import { TheCoinsComponent } from '../../components/collection/the-coins.component';
import { DecktrackerComponent } from '../../components/decktracker/decktracker.component';
import { DeckManaCurveBarComponent } from '../../components/decktracker/main/deck-mana-curve-bar.component';
import { DeckManaCurveComponent } from '../../components/decktracker/main/deck-mana-curve.component';
import { DeckMatchupInfoComponent } from '../../components/decktracker/main/deck-matchup-info.component';
import { DeckWinrateMatrixComponent } from '../../components/decktracker/main/deck-winrate-matrix.component';
import { DecktrackerDeckDetailsComponent } from '../../components/decktracker/main/decktracker-deck-details.component';
import { DecktrackerDeckRecapComponent } from '../../components/decktracker/main/decktracker-deck-recap.component';
import { DecktrackerDeckSummaryComponent } from '../../components/decktracker/main/decktracker-deck-summary.component';
import { DecktrackerDecksComponent } from '../../components/decktracker/main/decktracker-decks.component';
import { DecktrackerFiltersComponent } from '../../components/decktracker/main/decktracker-filters.component';
import { DecktrackerPersonalStatsRankingComponent } from '../../components/decktracker/main/decktracker-personal-stats-ranking.component';
import { DecktrackerReplaysRecapComponent } from '../../components/decktracker/main/decktracker-replays-recap.component';
import { MenuSelectionDecktrackerComponent } from '../../components/decktracker/main/menu-selection-decktracker.component';
import { DuelsDeckStatVignetteComponent } from '../../components/duels/desktop/duels-deck-stat-vignette.component';
import { DuelsDesktopComponent } from '../../components/duels/desktop/duels-desktop.component';
import { DuelsEmptyStateComponent } from '../../components/duels/desktop/duels-empty-state.component';
import { DuelsGroupedTopDecksComponent } from '../../components/duels/desktop/duels-grouped-top-decks.component';
import {
	DuelsGlobalValueComponent,
	DuelsHeroStatVignetteComponent,
} from '../../components/duels/desktop/duels-hero-stat-vignette.component';
import { DuelsHeroStatsComponent } from '../../components/duels/desktop/duels-hero-stats.component';
import { DuelsPersonalDeckDetailsComponent } from '../../components/duels/desktop/duels-personal-deck-details.component';
import { DuelsPersonalDecksVignetteComponent } from '../../components/duels/desktop/duels-personal-deck-vignette.component';
import { DuelsPersonalDecksComponent } from '../../components/duels/desktop/duels-personal-decks.component';
import { DuelsRewardComponent } from '../../components/duels/desktop/duels-reward.component';
import { DuelsRunComponent } from '../../components/duels/desktop/duels-run.component';
import { DuelsRunsListComponent } from '../../components/duels/desktop/duels-runs-list.component';
import { DuelsTopDecksComponent } from '../../components/duels/desktop/duels-top-decks.component';
import { DuelsTreasureStatVignetteComponent } from '../../components/duels/desktop/duels-treasure-stat-vignette.component';
import { DuelsTreasureStatsComponent } from '../../components/duels/desktop/duels-treasure-stat.component';
import { DuelsFilterDropdownComponent } from '../../components/duels/desktop/filters/duels-filter-dropdown.component';
import { DuelsFiltersComponent } from '../../components/duels/desktop/filters/duels-filters.component';
import { LootBundleComponent } from '../../components/duels/desktop/loot-bundle.component';
import { LootInfoComponent } from '../../components/duels/desktop/loot-info.component';
import {
	DuelsClassesRecapComponent,
	DuelsStatCellComponent,
} from '../../components/duels/desktop/secondary/duels-classes-recap.component';
import { DuelsDeckStatsComponent } from '../../components/duels/desktop/secondary/duels-deck-stats.component';
import { DuelsHeroSearchComponent } from '../../components/duels/desktop/secondary/duels-hero-search.component';
import { DuelsHeroTierListComponent } from '../../components/duels/desktop/secondary/duels-hero-tier-list.component';
import { DuelsReplaysRecapComponent } from '../../components/duels/desktop/secondary/duels-replays-recap.component';
import { DuelsTierComponent } from '../../components/duels/desktop/secondary/duels-tier.component';
import { DuelsTreasureSearchComponent } from '../../components/duels/desktop/secondary/duels-treasure-search.component';
import { DuelsTreasureTierListComponent } from '../../components/duels/desktop/secondary/duels-treasure-tier-list.component';
import { MainWindowComponent } from '../../components/main-window.component';
import { FtueComponent } from '../../components/main-window/ftue/ftue.component';
import { GlobalHeaderComponent } from '../../components/main-window/global-header.component';
import { NewVersionNotificationComponent } from '../../components/main-window/new-version-notification.component';
import { MenuSelectionComponent } from '../../components/menu-selection.component';
import { GameReplayComponent } from '../../components/replays/game-replay.component';
import { GroupedReplaysComponent } from '../../components/replays/grouped-replays.component';
import { MatchDetailsComponent } from '../../components/replays/match-details.component';
import { RankImageComponent } from '../../components/replays/rank-image.component';
import { ReplayInfoComponent } from '../../components/replays/replay-info.component';
import { ReplaysFilterComponent } from '../../components/replays/replays-filter.component';
import { ReplaysListComponent } from '../../components/replays/replays-list.component';
import { ReplaysComponent } from '../../components/replays/replays.component';
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
		SetStatsComponent,
		SetStatCellComponent,
		CardsComponent,
		CardSearchComponent,
		CardSearchAutocompleteItemComponent,
		CollectionComponent,
		CollectionMenuSelectionComponent,
		CollectionEmptyStateComponent,
		FullCardComponent,
		MainWindowComponent,
		MenuSelectionComponent,
		RarityComponent,
		SetComponent,
		SetsComponent,
		SetsContainer,
		CardBacksComponent,
		CardBackComponent,
		FullCardBackComponent,
		HeroPortraitsComponent,
		HeroPortraitComponent,
		TheCoinsComponent,
		OwnedFilterComponent,
		CollectionPackStatsComponent,

		AchievementsComponent,
		AchievementCompletionStepComponent,
		AchievementsCategoriesComponent,
		AchievementHistoryComponent,
		AchievementHistoryItemComponent,
		AchievementImageComponent,
		AchievementsListComponent,
		AchievementCategoryComponent,
		AchievementProgressBarComponent,
		AchievementViewComponent,
		AchievementsFilterComponent,

		DecktrackerComponent,
		DecktrackerDecksComponent,
		DecktrackerDeckSummaryComponent,
		DecktrackerFiltersComponent,
		DecktrackerDeckDetailsComponent,
		DeckWinrateMatrixComponent,
		DeckMatchupInfoComponent,
		DecktrackerDeckRecapComponent,
		DeckManaCurveComponent,
		DeckManaCurveBarComponent,
		DecktrackerReplaysRecapComponent,
		DecktrackerPersonalStatsRankingComponent,
		MenuSelectionDecktrackerComponent,

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
		BgsWinrateStatsForHeroComponent,
		BgsHeroDetailedStatsComponent,
		BattlegroundsEmptyStateComponent,
		BgsGlobalValueComponent,

		DuelsDesktopComponent,
		DuelsEmptyStateComponent,
		DuelsRunsListComponent,
		DuelsRunComponent,
		LootInfoComponent,
		LootBundleComponent,
		DuelsHeroStatsComponent,
		DuelsHeroStatVignetteComponent,
		DuelsGlobalValueComponent,
		DuelsFiltersComponent,
		DuelsFilterDropdownComponent,
		DuelsTreasureStatsComponent,
		DuelsTreasureStatVignetteComponent,
		DuelsTopDecksComponent,
		DuelsDeckStatVignetteComponent,
		DuelsGroupedTopDecksComponent,
		DuelsPersonalDecksComponent,
		DuelsPersonalDecksVignetteComponent,
		DuelsPersonalDeckDetailsComponent,
		DuelsClassesRecapComponent,
		DuelsStatCellComponent,
		DuelsRewardComponent,
		DuelsReplaysRecapComponent,
		DuelsReplaysRecapForRunComponent,
		DuelsDeckStatsComponent,
		DuelsTreasureTierListComponent,
		DuelsHeroTierListComponent,
		DuelsTierComponent,
		DuelsTreasureSearchComponent,
		DuelsHeroSearchComponent,

		FtueComponent,
		NewVersionNotificationComponent,
	],
	bootstrap: [MainWindowComponent],
	entryComponents: [BgsCardTooltipComponent],
	providers: [AdService, RealTimeNotificationService],
})
export class CollectionModule {}
