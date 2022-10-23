import { A11yModule } from '@angular/cdk/a11y';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClientModule } from '@angular/common/http';
import {
	ApplicationRef,
	ComponentFactoryResolver,
	DoBootstrap,
	ErrorHandler,
	Injectable,
	Injector,
	NgModule,
	Type,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BgsSimulatorKeyboardControls } from '@components/battlegrounds/battles/simulator-keyboard-controls.service';
import { CollectionCardClassFilterDropdownComponent } from '@components/collection/filters/card-class-filter.component';
import { CollectionCardOwnedFilterDropdownComponent } from '@components/collection/filters/card-owned-filter.component';
import { CollectionCardRarityFilterDropdownComponent } from '@components/collection/filters/card-rarity-filter.component';
import { DuelsBucketCardComponent } from '@components/duels/desktop/deckbuilder/duels-bucket-card.component';
import { DuelsBucketCardsListComponent } from '@components/duels/desktop/deckbuilder/duels-bucket-cards-list.component';
import { DuelsDeckbuilderBreadcrumbsComponent } from '@components/duels/desktop/deckbuilder/duels-deckbuilder-breadcrumbs.component';
import { DuelsDeckbuilderCardsComponent } from '@components/duels/desktop/deckbuilder/duels-deckbuilder-cards.component';
import { DuelsDeckbuilderHeroPowerComponent } from '@components/duels/desktop/deckbuilder/duels-deckbuilder-hero-power.component';
import { DuelsDeckbuilderHeroComponent } from '@components/duels/desktop/deckbuilder/duels-deckbuilder-hero.component';
import { DuelsDeckbuilderSignatureTreasureComponent } from '@components/duels/desktop/deckbuilder/duels-deckbuilder-signature-treasure.component';
import { DuelsDeckbuilderComponent } from '@components/duels/desktop/deckbuilder/duels-deckbuilder.component';
import { HeroPowerOverlayComponent } from '@components/overlays/board/hero-power-overlay.component';
import { OpponentAbyssalCurseWidgetWrapperComponent } from '@components/overlays/counters/opponent-abyssal-curse-widget-wrapper.component';
import { PlayerAbyssalCurseWidgetWrapperComponent } from '@components/overlays/counters/player-abyssal-curse-widget-wrapper.component';
import { PlayerBgsMajordomoWidgetWrapperComponent } from '@components/overlays/counters/player-bgs-majordomo-widget-wrapper.component';
import { PlayerBgsSouthseaWidgetWrapperComponent } from '@components/overlays/counters/player-bgs-southsea-widget-wrapper.component';
import { PlayerCoralKeeperWidgetWrapperComponent } from '@components/overlays/counters/player-coral-keeper-widget-wrapper.component';
import { PlayerGreySageParrotWidgetWrapperComponent } from '@components/overlays/counters/player-grey-sage-parrot-widget-wrapper.component';
import { CurrentSessionWidgetWrapperComponent } from '@components/overlays/current-session-widget-wrapper.component';
import { DuelsDecktrackerOocWidgetWrapperComponent } from '@components/overlays/duels-decktracker-ooc-widget-wrapper.component';
import { DuelsOocDeckSelectWidgetWrapperComponent } from '@components/overlays/duels-ooc-deck-select-widget-wrapper.component';
import { DuelsOutOfCombatHeroPowerSelectionWidgetWrapperComponent } from '@components/overlays/duels-ooc-hero-power-selection-widget-wrapper.component';
import { DuelsOutOfCombatHeroSelectionWidgetWrapperComponent } from '@components/overlays/duels-ooc-hero-selection-widget-wrapper.component';
import { DuelsOutOfCombatSignatureTreasureSelectionWidgetWrapperComponent } from '@components/overlays/duels-ooc-signature-treasure-widget-wrapper.component';
import { DuelsOutOfCombatTreasureSelectionWidgetWrapperComponent } from '@components/overlays/duels-ooc-treasure-selection-widget-wrapper.component';
import { DuelsDeckWidgetComponent } from '@components/overlays/duels-ooc/duels-deck-widget.component';
import { DuelsDecktrackerOocComponent } from '@components/overlays/duels-ooc/duels-decktracker-ooc.component';
import { DuelsHeroInfoComponent } from '@components/overlays/duels-ooc/duels-hero-info.component';
import { DuelsHeroPowerInfoComponent } from '@components/overlays/duels-ooc/duels-hero-power-info.component';
import { DuelsOutOfCombatDeckSelectComponent } from '@components/overlays/duels-ooc/duels-ooc-deck-select.component';
import { DuelsOutOfCombatHeroPowerSelectionComponent } from '@components/overlays/duels-ooc/duels-ooc-hero-power-selection.component';
import { DuelsOutOfCombatHeroSelectionComponent } from '@components/overlays/duels-ooc/duels-ooc-hero-selection.component';
import { DuelsOutOfCombatSignatureTreasureSelectionComponent } from '@components/overlays/duels-ooc/duels-ooc-signature-treasure-selection.component';
import { DuelsOutOfCombatTreasureSelectionComponent } from '@components/overlays/duels-ooc/duels-ooc-treasure-selection.component';
import { DuelsSignatureTreasureInfoComponent } from '@components/overlays/duels-ooc/duels-signature-treasure-info.component';
import { PlayerHeroPowerWidgetWrapperComponent } from '@components/overlays/player-hero-power-widget-wrapper.component';
import { CurrentSessionBgsBoardTooltipComponent } from '@components/overlays/session/current-session-bgs-board-tooltip.component';
import { CurrentSessionWidgetComponent } from '@components/overlays/session/current-session-widget.component';
import { ReplayInfoBattlegroundsComponent } from '@components/replays/replay-info/replay-info-battlegrounds.component';
import { ReplayInfoDuelsComponent } from '@components/replays/replay-info/replay-info-duels.component';
import { ReplayInfoGenericComponent } from '@components/replays/replay-info/replay-info-generic.component';
import {
	ReplayInfoMercenariesComponent,
	ReplayInfoMercPlayerComponent,
} from '@components/replays/replay-info/replay-info-mercenaries.component';
import { ReplayInfoRankedComponent } from '@components/replays/replay-info/replay-info-ranked.component';
import { ReplaysListViewComponent } from '@components/replays/replays-list-view.component';
import { SettingsBattlegroundsOverlayComponent } from '@components/settings/battlegrounds/settings-battlegrounds-overlay.component';
import { SettingsBattlegroundsSessionComponent } from '@components/settings/battlegrounds/settings-battlegrounds-session.component';
import { SettingsDecktrackerDuelsComponent } from '@components/settings/decktracker/settings-decktracker-duels.component';
import { AutofocusDirective } from '@directives/autofocus.directive';
import { ColiseumComponentsModule } from '@firestone-hs/coliseum-components';
import { AllCardsService as RefCards } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { NgxChartsModule } from '@sebastientromp/ngx-charts';
import { captureException, init, Integrations } from '@sentry/browser';
import { CaptureConsole, ExtraErrorData } from '@sentry/integrations';
import { AttackOnBoardService } from '@services/decktracker/attack-on-board.service';
import { DuelsMemoryCacheService } from '@services/duels/duels-memory-cache.service';
import { AngularResizedEventModule } from 'angular-resize-event';
import { SimpleNotificationsModule } from 'angular2-notifications';
import { InlineSVGModule } from 'ng-inline-svg';
import { SelectModule } from 'ng-select';
import { ChartsModule } from 'ng2-charts';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';
import { AchievementCategoryComponent } from '../../components/achievements/achievement-category.component';
import { AchievementCompletionStepComponent } from '../../components/achievements/achievement-completion-step.component';
import { AchievementHistoryItemComponent } from '../../components/achievements/achievement-history-item.component';
import { AchievementHistoryComponent } from '../../components/achievements/achievement-history.component';
import { AchievementImageComponent } from '../../components/achievements/achievement-image.component';
import { AchievementProgressBarComponent } from '../../components/achievements/achievement-progress-bar.component';
import { AchievementViewComponent } from '../../components/achievements/achievement-view.component';
import { AchievementsCategoriesComponent } from '../../components/achievements/achievements-categories.component';
import { AchievementsFilterComponent } from '../../components/achievements/achievements-filter.component.ts';
import { AchievementsListComponent } from '../../components/achievements/achievements-list.component';
import { AchievementsComponent } from '../../components/achievements/achievements.component';
import { AchievementsCompletedFilterDropdownComponent } from '../../components/achievements/filters/achievements-completed-filter-dropdown.component';
import { AppComponent } from '../../components/app.component';
import { ArenaClassesRecapComponent } from '../../components/arena/desktop/arena-classes-recap.component';
import { ArenaDesktopComponent } from '../../components/arena/desktop/arena-desktop.component';
import { ArenaEmptyStateComponent } from '../../components/arena/desktop/arena-empty-state.component';
import { ArenaRunComponent } from '../../components/arena/desktop/arena-run.component';
import { ArenaRunsListComponent } from '../../components/arena/desktop/arena-runs-list.component';
import { ArenaClassFilterDropdownComponent } from '../../components/arena/desktop/filters/arena-class-filter-dropdown.component';
import { ArenaTimeFilterDropdownComponent } from '../../components/arena/desktop/filters/arena-time-filter-dropdown.component';
import { ArenaFiltersComponent } from '../../components/arena/desktop/filters/_arena-filters.component';
import { BattlegroundsContentComponent } from '../../components/battlegrounds/battlegrounds-content.component';
import { BattlegroundsEmptyStateComponent } from '../../components/battlegrounds/battlegrounds-empty-state.component';
import { BattlegroundsComponent } from '../../components/battlegrounds/battlegrounds.component';
import { BgsBattlesComponent } from '../../components/battlegrounds/battles/bgs-battles.component';
import { BgsSimulatorHeroPowerSelectionComponent } from '../../components/battlegrounds/battles/bgs-simulator-hero-power-selection.component';
import { BgsSimulatorHeroSelectionComponent } from '../../components/battlegrounds/battles/bgs-simulator-hero-selection.component';
import { BgsSimulatorMinionSelectionComponent } from '../../components/battlegrounds/battles/bgs-simulator-minion-selection.component';
import { BattlegroundsSimulatorMinionTierFilterDropdownComponent } from '../../components/battlegrounds/battles/bgs-simulator-minion-tier-filter-dropdown.component';
import { BattlegroundsSimulatorMinionTribeFilterDropdownComponent } from '../../components/battlegrounds/battles/bgs-simulator-minion-tribe-filter-dropdown.component';
import { BgsSimulatorQuestRewardSelectionComponent } from '../../components/battlegrounds/battles/bgs-simulator-quest-reward-selection.component';
import { BgsBannedTribeComponent } from '../../components/battlegrounds/bgs-banned-tribe.component';
import { BgsBannedTribesComponent } from '../../components/battlegrounds/bgs-banned-tribes.component';
import { BgsCardTooltipComponent } from '../../components/battlegrounds/bgs-card-tooltip.component';
import { BattlegroundsCategoryDetailsComponent } from '../../components/battlegrounds/desktop/battlegrounds-category-details.component';
import { BattlegroundsDesktopComponent } from '../../components/battlegrounds/desktop/battlegrounds-desktop.component';
import { BattlegroundsDesktopOverviewComponent } from '../../components/battlegrounds/desktop/categories/battlegrounds-desktop-overview.component';
import { BattlegroundsPerfectGamesComponent } from '../../components/battlegrounds/desktop/categories/battlegrounds-perfect-games.component';
import { BattlegroundsPersonalStatsHeroDetailsComponent } from '../../components/battlegrounds/desktop/categories/battlegrounds-personal-stats-hero-details.component';
import { BattlegroundsPersonalStatsHeroesComponent } from '../../components/battlegrounds/desktop/categories/battlegrounds-personal-stats-heroes.component';
import { BattlegroundsPersonalStatsQuestsComponent } from '../../components/battlegrounds/desktop/categories/battlegrounds-personal-stats-quests.component';
import { BattlegroundsPersonalStatsRatingComponent } from '../../components/battlegrounds/desktop/categories/battlegrounds-personal-stats-rating.component';
import { BattlegroundsPersonalStatsStatsComponent } from '../../components/battlegrounds/desktop/categories/battlegrounds-personal-stats-stats.component';
import { BattlegroundsSimulatorComponent } from '../../components/battlegrounds/desktop/categories/battlegrounds-simulator.component';
import { BattlegroundsStatsHeroVignetteComponent } from '../../components/battlegrounds/desktop/categories/battlegrounds-stats-hero-vignette.component';
import { BattlegroundsStatsQuestVignetteComponent } from '../../components/battlegrounds/desktop/categories/battlegrounds-stats-quest-vignette.component';
import {
	BgsGlobalValueComponent,
	BgsHeroDetailedStatsComponent,
} from '../../components/battlegrounds/desktop/categories/hero-details/bgs-hero-detailed-stats.component';
import { BgsLastWarbandsComponent } from '../../components/battlegrounds/desktop/categories/hero-details/bgs-last-warbands.component';
import { BgsMmrEvolutionForHeroComponent } from '../../components/battlegrounds/desktop/categories/hero-details/bgs-mmr-evolution-for-hero.component';
import { BgsWarbandStatsForHeroComponent } from '../../components/battlegrounds/desktop/categories/hero-details/bgs-warband-stats-for-hero.component';
import { BgsWinrateStatsForHeroComponent } from '../../components/battlegrounds/desktop/categories/hero-details/bgs-winrate-stats-for-hero.component';
import { BattlegroundsHeroFilterDropdownComponent } from '../../components/battlegrounds/desktop/filters/battlegrounds-hero-filter-dropdown.component';
import { BattlegroundsHeroSortDropdownComponent } from '../../components/battlegrounds/desktop/filters/battlegrounds-hero-sort-dropdown.component';
import { BattlegroundsRankFilterDropdownComponent } from '../../components/battlegrounds/desktop/filters/battlegrounds-rank-filter-dropdown.component';
import { BattlegroundsRankGroupDropdownComponent } from '../../components/battlegrounds/desktop/filters/battlegrounds-rank-group-dropdown.component';
import { BattlegroundsTimeFilterDropdownComponent } from '../../components/battlegrounds/desktop/filters/battlegrounds-time-filter-dropdown.component';
import { BattlegroundsTribesFilterDropdownComponent } from '../../components/battlegrounds/desktop/filters/battlegrounds-tribes-filter-dropdown.component';
import { BattlegroundsFiltersComponent } from '../../components/battlegrounds/desktop/filters/_battlegrounds-filters.component';
import { BattlegroundsHeroRecordsBrokenComponent } from '../../components/battlegrounds/desktop/secondary/battlegrounds-hero-records-broken.component';
import { BattlegroundsHeroesRecordsBrokenComponent } from '../../components/battlegrounds/desktop/secondary/battlegrounds-heroes-records-broken.component';
import { BattlegroundsQuestsTierListComponent } from '../../components/battlegrounds/desktop/secondary/battlegrounds-quests-tier-list.component';
import { BattlegroundsReplaysRecapComponent } from '../../components/battlegrounds/desktop/secondary/battlegrounds-replays-recap.component';
import { BattlegroundsTierListComponent } from '../../components/battlegrounds/desktop/secondary/battlegrounds-tier-list.component';
import { GraphWithSingleValueComponent } from '../../components/battlegrounds/graph-with-single-value.component';
import { BgsHeroSelectionOverviewComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-selection-overview.component';
// import { BgsHeroWarbandStatsComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-warband-stats.component';
import { MenuSelectionBgsComponent } from '../../components/battlegrounds/menu-selection-bgs.component';
import { BattlegroundsMinionsTiersOverlayComponent } from '../../components/battlegrounds/minions-tiers/battlegrounds-minions-tiers.component';
import { BattlegroundsOverlayButtonComponent } from '../../components/battlegrounds/overlay/battlegrounds-overlay-button.component';
import { BgsHeroSelectionOverlayComponent } from '../../components/battlegrounds/overlay/bgs-hero-selection-overlay.component';
import { BgsTavernMinionComponent } from '../../components/battlegrounds/overlay/bgs-tavern-minion.component';
import { BgsSimulationOverlayComponent } from '../../components/battlegrounds/simulation-overlay/bgs-simulation-overlay.component';
import { CardBackComponent } from '../../components/collection/card-back.component';
import { CardBacksComponent } from '../../components/collection/card-backs.component';
import { CardHistoryItemComponent } from '../../components/collection/card-history-item.component';
import { CardHistoryComponent } from '../../components/collection/card-history.component';
import { CardSearchComponent } from '../../components/collection/card-search.component';
import { CardComponent } from '../../components/collection/card.component';
import { CardsComponent } from '../../components/collection/cards.component';
import { CollectionEmptyStateComponent } from '../../components/collection/collection-empty-state.component';
import { CollectionMenuSelectionComponent } from '../../components/collection/collection-menu-selection.component';
import { CollectionComponent } from '../../components/collection/collection.component';
import { CollectionHeroPortraitCategoriesFilterDropdownComponent } from '../../components/collection/filters/collection-hero-portrait-categories-filter-dropdown.component';
import { CollectionHeroPortraitOwnedFilterDropdownComponent } from '../../components/collection/filters/collection-hero-portrait-owned-filter-dropdown.component';
import { OwnedFilterComponent } from '../../components/collection/filters/owned-filter.component';
import { FullCardBackComponent } from '../../components/collection/full-card-back.component';
import { FullCardComponent } from '../../components/collection/full-card.component';
import { HeroPortraitComponent } from '../../components/collection/hero-portrait.component';
import { HeroPortraitsComponent } from '../../components/collection/hero-portraits.component';
import { PackDisplayComponent } from '../../components/collection/pack-display.component';
import { PackHistoryItemComponent } from '../../components/collection/pack-history-item.component';
import { PackHistoryComponent } from '../../components/collection/pack-history.component';
import { CollectionPackStatsComponent } from '../../components/collection/pack-stats.component';
import { RarityComponent } from '../../components/collection/rarity.component';
import { SetStatCellComponent } from '../../components/collection/set-stat-cell.component';
import { SetStatsComponent } from '../../components/collection/set-stats.component';
import { SetComponent } from '../../components/collection/set.component';
import { SetsContainerComponent } from '../../components/collection/sets-container.component';
import { SetsComponent } from '../../components/collection/sets.component';
import { TheCoinsComponent } from '../../components/collection/the-coins.component';
import { SearchAutocompleteItemComponent } from '../../components/common/autocomplete-search-with-list-item.component';
import { AutocompleteSearchWithListComponent } from '../../components/common/autocomplete-search-with-list.component';
import { DecktrackerComponent } from '../../components/decktracker/decktracker.component';
import { ConstructedMetaDeckSummaryComponent } from '../../components/decktracker/main/constructed-meta-deck-summary.component';
import { ConstructedMetaDecksComponent } from '../../components/decktracker/main/constructed-meta-decks.component';
import { DeckManaCurveBarComponent } from '../../components/decktracker/main/deck-mana-curve-bar.component';
import { DeckManaCurveComponent } from '../../components/decktracker/main/deck-mana-curve.component';
import { DeckMatchupInfoComponent } from '../../components/decktracker/main/deck-matchup-info.component';
import { DeckWinrateMatrixComponent } from '../../components/decktracker/main/deck-winrate-matrix.component';
import { ConstructedDeckbuilderBreadcrumbsComponent } from '../../components/decktracker/main/deckbuilder/constructed-deckbuilder-breadcrumbs.component';
import { ConstructedDeckbuilderCardsComponent } from '../../components/decktracker/main/deckbuilder/constructed-deckbuilder-cards.component';
import { ConstructedDeckbuilderClassComponent } from '../../components/decktracker/main/deckbuilder/constructed-deckbuilder-class.component';
import { ConstructedDeckbuilderFormatComponent } from '../../components/decktracker/main/deckbuilder/constructed-deckbuilder-format.component';
import { ConstructedDeckbuilderComponent } from '../../components/decktracker/main/deckbuilder/constructed-deckbuilder.component';
import { DecktrackerDeckDetailsComponent } from '../../components/decktracker/main/decktracker-deck-details.component';
import { DecktrackerDeckRecapComponent } from '../../components/decktracker/main/decktracker-deck-recap.component';
import { DecktrackerDeckSummaryComponent } from '../../components/decktracker/main/decktracker-deck-summary.component';
import {
	DecktrackerDeckDragTemplateComponent,
	DecktrackerDecksComponent,
} from '../../components/decktracker/main/decktracker-decks.component';
import { DecktrackerLadderStatsMatchupsComponent } from '../../components/decktracker/main/decktracker-ladder-stats-matchups.component';
import { DecktrackerLadderStatsOverviewComponent } from '../../components/decktracker/main/decktracker-ladder-stats-overview.component';
import { DecktrackerLadderStatsComponent } from '../../components/decktracker/main/decktracker-ladder-stats.component';
import { DecktrackerRatingGraphComponent } from '../../components/decktracker/main/decktracker-rating-graph.component';
import { DecktrackerReplaysRecapComponent } from '../../components/decktracker/main/decktracker-replays-recap.component';
import { DecktrackerStatsForReplaysComponent } from '../../components/decktracker/main/decktracker-stats-for-replays.component';
import { ConstructedFormatFilterDropdownComponent } from '../../components/decktracker/main/filters/constructed-format-filter-dropdown.component';
import { ConstructedMyDecksSearchComponent } from '../../components/decktracker/main/filters/constructed-my-decks-search.component';
import { ConstructedRankFilterDropdownComponent } from '../../components/decktracker/main/filters/constructed-rank-filter-dropdown.component';
import { ConstructedTimeFilterDropdownComponent } from '../../components/decktracker/main/filters/constructed-time-filter-dropdown.component';
import { DecktrackerDeckSortDropdownComponent } from '../../components/decktracker/main/filters/decktracker-deck-sort-dropdown.component';
import { DecktrackerFormatFilterDropdownComponent } from '../../components/decktracker/main/filters/decktracker-format-filter-dropdown.component';
import { DecktrackerRankCategoryDropdownComponent } from '../../components/decktracker/main/filters/decktracker-rank-category-dropdown.component';
import { DecktrackerRankFilterDropdownComponent } from '../../components/decktracker/main/filters/decktracker-rank-filter-dropdown.component';
import { DecktrackerRankGroupDropdownComponent } from '../../components/decktracker/main/filters/decktracker-rank-group-dropdown.component';
import { DecktrackerTimeFilterDropdownComponent } from '../../components/decktracker/main/filters/decktracker-time-filter-dropdown.component';
import { DecktrackerFiltersComponent } from '../../components/decktracker/main/filters/_decktracker-filters.component';
import { MenuSelectionDecktrackerComponent } from '../../components/decktracker/main/menu-selection-decktracker.component';
import { DeckTrackerOverlayOpponentComponent } from '../../components/decktracker/overlay/decktracker-overlay-opponent.component';
import { DeckTrackerOverlayPlayerComponent } from '../../components/decktracker/overlay/decktracker-overlay-player.component';
import { TwitchBgsHeroOverviewComponent } from '../../components/decktracker/overlay/twitch/twitch-bgs-hero-overview.component';
import { DuelsBucketsComponent } from '../../components/duels/desktop/duels-buckets.component';
import { DuelsDeckStatVignetteComponent } from '../../components/duels/desktop/duels-deck-stat-vignette.component';
import { DuelsDesktopComponent } from '../../components/duels/desktop/duels-desktop.component';
import { DuelsEmptyStateComponent } from '../../components/duels/desktop/duels-empty-state.component';
import { DuelsGroupedTopDecksComponent } from '../../components/duels/desktop/duels-grouped-top-decks.component';
import {
	DuelsGlobalValueComponent,
	DuelsHeroStatVignetteComponent,
} from '../../components/duels/desktop/duels-hero-stat-vignette.component';
import { DuelsHeroStatsComponent } from '../../components/duels/desktop/duels-hero-stats.component';
import { DuelsLeaderboardComponent } from '../../components/duels/desktop/duels-leaderboard.component';
import { DuelsPersonalDeckDetailsComponent } from '../../components/duels/desktop/duels-personal-deck-details.component';
import { DuelsPersonalDecksVignetteComponent } from '../../components/duels/desktop/duels-personal-deck-vignette.component';
import { DuelsPersonalDecksComponent } from '../../components/duels/desktop/duels-personal-decks.component';
import { DuelsRewardComponent } from '../../components/duels/desktop/duels-reward.component';
import { DuelsRunComponent } from '../../components/duels/desktop/duels-run.component';
import { DuelsRunsListComponent } from '../../components/duels/desktop/duels-runs-list.component';
import { DuelsTopDecksComponent } from '../../components/duels/desktop/duels-top-decks.component';
import { DuelsTreasureStatsComponent } from '../../components/duels/desktop/duels-treasure-stat.component';
import { DuelsDeckSortDropdownComponent } from '../../components/duels/desktop/filters/duels-deck-sort-dropdown.component';
import { DuelsDustFilterDropdownComponent } from '../../components/duels/desktop/filters/duels-dust-filter-dropdown.component';
import { DuelsGameModeFilterDropdownComponent } from '../../components/duels/desktop/filters/duels-game-mode-filter-dropdown.component';
import { DuelsHeroFilterDropdownComponent } from '../../components/duels/desktop/filters/duels-hero-filter-dropdown.component';
import { DuelsHeroPowerFilterDropdownComponent } from '../../components/duels/desktop/filters/duels-hero-power-filter-dropdown.component';
import { DuelsHeroSortDropdownComponent } from '../../components/duels/desktop/filters/duels-hero-sort-dropdown.component';
import { DuelsLeaderboardGameModeFilterDropdownComponent } from '../../components/duels/desktop/filters/duels-leaderboard-game-mode-filter-dropdown.component';
import { DuelsMmrFilterDropdownComponent } from '../../components/duels/desktop/filters/duels-mmr-filter-dropdown.component';
import { DuelsPassiveFilterDropdownComponent } from '../../components/duels/desktop/filters/duels-passive-filter-dropdown.component';
import { DuelsSignatureTreasureFilterDropdownComponent } from '../../components/duels/desktop/filters/duels-signature-treasure-filter-dropdown.component';
import { DuelsStatTypeFilterDropdownComponent } from '../../components/duels/desktop/filters/duels-stat-type-filter-dropdown.component';
import { DuelsTimeFilterDropdownComponent } from '../../components/duels/desktop/filters/duels-time-filter-dropdown.component';
import { DuelsTreasurePassiveTypeFilterDropdownComponent } from '../../components/duels/desktop/filters/duels-treasure-passive-type-filter-dropdown.component';
import { DuelsTreasuresSortDropdownComponent } from '../../components/duels/desktop/filters/duels-treasures-sort-dropdown.component';
import { DuelsFiltersComponent } from '../../components/duels/desktop/filters/_duels-filters.component';
import { LootBundleComponent } from '../../components/duels/desktop/loot-bundle.component';
import {
	DuelsClassesRecapComponent,
	DuelsStatCellComponent,
} from '../../components/duels/desktop/secondary/duels-classes-recap.component';
import { DuelsDeckStatsComponent } from '../../components/duels/desktop/secondary/duels-deck-stats.component';
import { DuelsHeroSearchComponent } from '../../components/duels/desktop/secondary/duels-hero-search.component';
import { DuelsHeroTierListComponent } from '../../components/duels/desktop/secondary/duels-hero-tier-list.component';
import { DuelsReplaysRecapForRunComponent } from '../../components/duels/desktop/secondary/duels-replays-recap-for-run.component';
import { DuelsReplaysRecapComponent } from '../../components/duels/desktop/secondary/duels-replays-recap.component';
import { DuelsTierComponent } from '../../components/duels/desktop/secondary/duels-tier.component';
import { DuelsTreasureSearchComponent } from '../../components/duels/desktop/secondary/duels-treasure-search.component';
import { DuelsTreasureTierListComponent } from '../../components/duels/desktop/secondary/duels-treasure-tier-list.component';
import { GameCountersComponent } from '../../components/game-counters/game-counters.component';
import { GenericCountersComponent } from '../../components/game-counters/generic-counter.component';
import { LoadingComponent } from '../../components/loading/loading.component';
import { MainWindowComponent } from '../../components/main-window.component';
import { FtueComponent } from '../../components/main-window/ftue/ftue.component';
import { GlobalHeaderComponent } from '../../components/main-window/global-header.component';
import { NewVersionNotificationComponent } from '../../components/main-window/new-version-notification.component';
import { MenuSelectionComponent } from '../../components/menu-selection.component';
import { MercenariesFullyUpgradedFilterDropdownComponent } from '../../components/mercenaries/desktop/filters/mercenaries-fully-upgraded-filter-dropdown.component';
import { MercenariesHeroLevelFilterDropdownComponent } from '../../components/mercenaries/desktop/filters/mercenaries-level-filter-dropdown.component';
import { MercenariesModeFilterDropdownComponent } from '../../components/mercenaries/desktop/filters/mercenaries-mode-filter-dropdown.component';
import { MercenariesOwnedFilterDropdownComponent } from '../../components/mercenaries/desktop/filters/mercenaries-owned-filter-dropdown.component';
import { MercenariesPveDifficultyFilterDropdownComponent } from '../../components/mercenaries/desktop/filters/mercenaries-pve-difficulty-filter-dropdown.component';
import { MercenariesPvpMmrFilterDropdownComponent } from '../../components/mercenaries/desktop/filters/mercenaries-pvp-mmr-filter-dropdown.component';
import { MercenariesRoleFilterDropdownComponent } from '../../components/mercenaries/desktop/filters/mercenaries-role-filter-dropdown.component';
import { MercenariesStarterFilterDropdownComponent } from '../../components/mercenaries/desktop/filters/mercenaries-starter-filter-dropdown.component';
import { MercenariesFiltersComponent } from '../../components/mercenaries/desktop/filters/_mercenaries-filters.component';
import { MercenariesCompositionStatComponent } from '../../components/mercenaries/desktop/mercenaries-composition-stat.component';
import { MercenariesCompositionsStatsComponent } from '../../components/mercenaries/desktop/mercenaries-compositions-stats.component';
import { MercenariesDesktopComponent } from '../../components/mercenaries/desktop/mercenaries-desktop.component';
import { MercenariesEmptyStateComponent } from '../../components/mercenaries/desktop/mercenaries-empty-state.component';
import { MercenariesMetaHeroDetailsComponent } from '../../components/mercenaries/desktop/mercenaries-meta-hero-details.component';
import { MercenariesMetaHeroStatComponent } from '../../components/mercenaries/desktop/mercenaries-meta-hero-stat.component';
import { MercenariesMetaHeroStatsComponent } from '../../components/mercenaries/desktop/mercenaries-meta-hero-stats.component';
import { MercenariesMyTeamsComponent } from '../../components/mercenaries/desktop/mercenaries-my-teams.component';
import { MercenariesPersonalHeroStatComponent } from '../../components/mercenaries/desktop/mercenaries-personal-hero-stat.component';
import {
	MercenariesPersonalHeroStatsComponent,
	SortableLabelComponent,
} from '../../components/mercenaries/desktop/mercenaries-personal-hero-stats.component';
import { MercenariesPersonalTeamSummaryComponent } from '../../components/mercenaries/desktop/mercenaries-personal-team-summary.component';
import { MercenariesHeroSearchComponent } from '../../components/mercenaries/desktop/secondary/mercenaries-hero-search.component';
import { MercenariesHeroDetailsComponent } from '../../components/mercenaries/desktop/toberebuilt_mercenaries-hero-details.component';
import { MercenariesComposiionDetailsComponent } from '../../components/mercenaries/desktop/unused_mercenaries-composition-details.component';
import { MercenariesActionsQueueComponent } from '../../components/mercenaries/overlay/action-queue/mercenaries-action-queue..component';
import { MercenariesActionComponent } from '../../components/mercenaries/overlay/action-queue/mercenaries-action.component';
import { MercenariesHighlightDirective } from '../../components/mercenaries/overlay/teams/mercenaries-highlight.directive';
import { MercenariesOpponentTeamComponent } from '../../components/mercenaries/overlay/teams/mercenaries-opponent-team.component';
import { MercenariesOutOfCombatPlayerTeamComponent } from '../../components/mercenaries/overlay/teams/mercenaries-out-of-combat-player-team.component';
import { MercenariesPlayerTeamComponent } from '../../components/mercenaries/overlay/teams/mercenaries-player-team.component';
import { MercenariesTeamAbilityComponent } from '../../components/mercenaries/overlay/teams/mercenaries-team-ability.component';
import { MercenariesTeamControlBarComponent } from '../../components/mercenaries/overlay/teams/mercenaries-team-control-bar.component';
import { MercenariesTeamListComponent } from '../../components/mercenaries/overlay/teams/mercenaries-team-list.component';
import { MercenariesTeamMercenaryComponent } from '../../components/mercenaries/overlay/teams/mercenaries-team-mercenary.component';
import {
	MercenariesTeamRootComponent,
	MercsTasksListComponent,
} from '../../components/mercenaries/overlay/teams/mercenaries-team-root..component';
import { MercenariesOutOfCombatTreasureSelectionComponent } from '../../components/mercenaries/overlay/treasure-selection/mercenaries-out-of-combat-treasure-selection.component';
import { NotificationsComponent } from '../../components/notifications.component';
import { BgsBannedTribesWidgetWrapperComponent } from '../../components/overlays/bgs-banned-tribes-widget-wrapper.component';
import { BgsBattleSimulationWidgetWrapperComponent } from '../../components/overlays/bgs-battle-simulation-widget-wrapper.component';
import { BgsBoardWidgetWrapperComponent } from '../../components/overlays/bgs-board-widget-wrapper.component';
import { BgsHeroSelectionWidgetWrapperComponent } from '../../components/overlays/bgs-hero-selection-widget-wrapper.component';
import { BgsLeaderboardWidgetWrapperComponent } from '../../components/overlays/bgs-leaderboard-widget-wrapper.component';
import { BgsMinionsTiersWidgetWrapperComponent } from '../../components/overlays/bgs-minion-tiers-widget-wrapper.component';
import { BgsQuestsWidgetWrapperComponent } from '../../components/overlays/bgs-quests-widget-wrapper.component';
import { BgsWindowButtonWidgetWrapperComponent } from '../../components/overlays/bgs-window-button-widget-wrapper.component';
import { MinionOnBoardOverlayComponent } from '../../components/overlays/board/minion-on-board-overlay.component';
import {
	ChoosingCardOptionComponent,
	ChoosingCardWidgetWrapperComponent,
} from '../../components/overlays/card-choice/choosing-card-widget-wrapper.component';
import { ConstructedBoardWidgetWrapperComponent } from '../../components/overlays/constructed-board-widget-wrapper.component';
import { AbstractCounterWidgetWrapperComponent } from '../../components/overlays/counters/abstract-counter-widget-wrapper.component';
import { OpponentCounterWidgetWrapperComponent } from '../../components/overlays/counters/opponent-attack-widget-wrapper.component';
import { OpponentCthunWidgetWrapperComponent } from '../../components/overlays/counters/opponent-cthun-widget-wrapper.component';
import { OpponentElwynnBoarWidgetWrapperComponent } from '../../components/overlays/counters/opponent-elwynn-boar-widget-wrapper.component';
import { OpponentFatigueWidgetWrapperComponent } from '../../components/overlays/counters/opponent-fatigue-widget-wrapper.component';
import { OpponentGalakrondWidgetWrapperComponent } from '../../components/overlays/counters/opponent-galakrond-widget-wrapper.component';
import { OpponentHeroPowerDamageWidgetWrapperComponent } from '../../components/overlays/counters/opponent-hero-power-damage-widget-wrapper.component';
import { OpponentJadeWidgetWrapperComponent } from '../../components/overlays/counters/opponent-jade-widget-wrapper.component';
import { OpponentLibramWidgetWrapperComponent } from '../../components/overlays/counters/opponent-libram-widget-wrapper.component';
import { OpponentPogoWidgetWrapperComponent } from '../../components/overlays/counters/opponent-pogo-widget-wrapper.component';
import { OpponentRelicWidgetWrapperComponent } from '../../components/overlays/counters/opponent-relic-widget-wrapper.component';
import { OpponentVolatileSkeletonWidgetWrapperComponent } from '../../components/overlays/counters/opponent-volatile-skeleton-widget-wrapper.component';
import { OpponentWatchpostCounterWidgetWrapperComponent } from '../../components/overlays/counters/opponent-watchpost-widget-wrapper.component';
import { PlayerCounterWidgetWrapperComponent } from '../../components/overlays/counters/player-attack-widget-wrapper.component';
import { PlayerBolnerWidgetWrapperComponent } from '../../components/overlays/counters/player-bolner-widget-wrapper.component';
import { PlayerBrilliantMacawWidgetWrapperComponent } from '../../components/overlays/counters/player-brilliant-macaw-widget-wrapper.component';
import { PlayerCthunWidgetWrapperComponent } from '../../components/overlays/counters/player-cthun-widget-wrapper.component';
import { PlayerElementalWidgetWrapperComponent } from '../../components/overlays/counters/player-elemental-widget-wrapper.component';
import { PlayerElwynnBoarWidgetWrapperComponent } from '../../components/overlays/counters/player-elwynn-boar-widget-wrapper.component';
import { PlayerFatigueWidgetWrapperComponent } from '../../components/overlays/counters/player-fatigue-widget-wrapper.component';
import { PlayerGalakrondWidgetWrapperComponent } from '../../components/overlays/counters/player-galakrond-widget-wrapper.component';
import { PlayerHeroPowerDamageWidgetWrapperComponent } from '../../components/overlays/counters/player-hero-power-damage-widget-wrapper.component';
import { PlayerJadeWidgetWrapperComponent } from '../../components/overlays/counters/player-jade-widget-wrapper.component';
import { PlayerLadyDarkveinWidgetWrapperComponent } from '../../components/overlays/counters/player-lady-darkvein-widget-wrapper.component';
import { PlayerLibramWidgetWrapperComponent } from '../../components/overlays/counters/player-libram-widget-wrapper.component';
import { PlayerMonstrousParrotWidgetWrapperComponent } from '../../components/overlays/counters/player-monstrous-parrot-widget-wrapper.component';
import { PlayerMulticasterWidgetWrapperComponent } from '../../components/overlays/counters/player-multicaster-widget-wrapper.component';
import { PlayerMurozondTheInfiniteWidgetWrapperComponent } from '../../components/overlays/counters/player-murozond-widget-wrapper.component';
import { PlayerPogoWidgetWrapperComponent } from '../../components/overlays/counters/player-pogo-widget-wrapper.component';
import { PlayerRelicWidgetWrapperComponent } from '../../components/overlays/counters/player-relic-widget-wrapper.component';
import { PlayerSpellWidgetWrapperComponent } from '../../components/overlays/counters/player-spell-widget-wrapper.component';
import { PlayerVanessaVanCleefWidgetWrapperComponent } from '../../components/overlays/counters/player-vanessa-widget-wrapper.component';
import { PlayerVolatileSkeletonWidgetWrapperComponent } from '../../components/overlays/counters/player-volatile-skeleton-widget-wrapper.component';
import { PlayerWatchpostCounterWidgetWrapperComponent } from '../../components/overlays/counters/player-watchpost-widget-wrapper.component';
import { DecktrackerOpponentWidgetWrapperComponent } from '../../components/overlays/decktracker-opponent-widget-wrapper.component';
import { DecktrackerPlayerWidgetWrapperComponent } from '../../components/overlays/decktracker-player-widget-wrapper.component';
import { DuelsMaxLifeOpponentWidgetWrapperComponent } from '../../components/overlays/duels-max-life-player-widget-wrapper.component';
import { DuelsMaxLifeWidgetComponent } from '../../components/overlays/duels-max-life/duels-max-life-widget.component';
import { HsQuestsWidgetWrapperComponent } from '../../components/overlays/hs-quests-widget-wrapper.component';
import { MercsActionQueueWidgetWrapperComponent } from '../../components/overlays/mercs-action-queue-widget-wrapper.component';
import { MercsOpponentTeamWidgetWrapperComponent } from '../../components/overlays/mercs-opponent-team-widget-wrapper.component';
import { MercsOutOfCombatPlayerTeamWidgetWrapperComponent } from '../../components/overlays/mercs-out-of-combat-player-team-widget-wrapper.component';
import { MercsPlayerTeamWidgetWrapperComponent } from '../../components/overlays/mercs-player-team-widget-wrapper.component';
import { MercsQuestsWidgetWrapperComponent } from '../../components/overlays/mercs-quests-widget-wrapper.component';
import { MercsTreasureSelectionWidgetWrapperComponent } from '../../components/overlays/mercs-treasure-selection-widget-wrapper.component';
import { OpponentHandWidgetWrapperComponent } from '../../components/overlays/opponent-hand-widget-wrapper.component';
import { OpponentCardInfoIdComponent } from '../../components/overlays/opponenthand/opponent-card-info-id.component';
import { OpponentCardInfoComponent } from '../../components/overlays/opponenthand/opponent-card-info.component';
import { OpponentCardInfosComponent } from '../../components/overlays/opponenthand/opponent-card-infos.component';
import { OpponentCardTurnNumberComponent } from '../../components/overlays/opponenthand/opponent-card-turn-number.component';
import { OpponentHandOverlayComponent } from '../../components/overlays/opponenthand/opponent-hand-overlay.component';
import { BgsQuestsWidgetComponent } from '../../components/overlays/quests/bgs-quests-widget.component';
import { HsQuestsWidgetComponent } from '../../components/overlays/quests/hs-quests-widget.component';
import { MercsQuestsWidgetComponent } from '../../components/overlays/quests/mercs-quests-widget.component';
import {
	HsQuestsListWidgetComponent,
	QuestsWidgetViewComponent,
} from '../../components/overlays/quests/quests-widget-view.component';
import { SecretsHelperWidgetWrapperComponent } from '../../components/overlays/secrets-helper-widget-wrapper.component';
import { TurnTimerWidgetWrapperComponent } from '../../components/overlays/turn-timer-widget-wrapper.component';
import {
	TurnTimerPlayerComponent,
	TurnTimerWidgetComponent,
} from '../../components/overlays/turntimer/turn-timer-widget.component';
import { FullScreenOverlaysClickthroughComponent } from '../../components/overlays/_full-screen-overlays-clickthrough.component';
import { FullScreenOverlaysComponent } from '../../components/overlays/_full-screen-overlays.component';
import { RegionFilterDropdownComponent } from '../../components/replays/filters/region-filter-dropdown.component';
import { ReplaysBgHeroFilterDropdownComponent } from '../../components/replays/filters/replays-bg-hero-filter-dropdown.component';
import { ReplaysDeckstringFilterDropdownComponent } from '../../components/replays/filters/replays-deckstring-filter-dropdown.component';
import { ReplaysGameModeFilterDropdownComponent } from '../../components/replays/filters/replays-game-mode-filter-dropdown.component';
import { ReplaysOpponentClassFilterDropdownComponent } from '../../components/replays/filters/replays-opponent-class-filter-dropdown.component';
import { ReplaysPlayerClassFilterDropdownComponent } from '../../components/replays/filters/replays-player-class-filter-dropdown.component';
import { GameReplayComponent } from '../../components/replays/game-replay.component';
import { GroupedReplaysComponent } from '../../components/replays/grouped-replays.component';
import { MatchDetailsComponent } from '../../components/replays/match-details.component';
import { RankImageComponent } from '../../components/replays/rank-image.component';
import { ReplayInfoComponent } from '../../components/replays/replay-info/_replay-info.component';
import { ReplayIconToggleComponent } from '../../components/replays/replays-icon-toggle.component';
import { ReplaysListComponent } from '../../components/replays/replays-list.component';
import { ReplayMercDetailsToggleComponent } from '../../components/replays/replays-merc-details-toggle.component';
import { ReplaysComponent } from '../../components/replays/replays.component';
import { SecretsHelperControlBarComponent } from '../../components/secrets-helper/secrets-helper-control-bar.component';
import { SecretsHelperWidgetIconComponent } from '../../components/secrets-helper/secrets-helper-widget-icon.component';
import { SecretsHelperComponent } from '../../components/secrets-helper/secrets-helper.component';
import { SettingsAchievementsMenuComponent } from '../../components/settings/achievements/settings-achievements-menu.component';
import { SettingsAchievementsNotificationsComponent } from '../../components/settings/achievements/settings-achievements-notifications.component';
import { SettingsAchievementsComponent } from '../../components/settings/achievements/settings-achievements.component';
import { SettingsAchievementsLiveComponent } from '../../components/settings/achievements/unused_settings-achievements-live.component';
import { AdvancedSettingDirective } from '../../components/settings/advanced-setting.directive';
import { SettingsBattlegroundsGeneralComponent } from '../../components/settings/battlegrounds/settings-battlegrounds-general.component';
import { SettingsBattlegroundsMenuComponent } from '../../components/settings/battlegrounds/settings-battlegrounds-menu.component';
import { SettingsBattlegroundsComponent } from '../../components/settings/battlegrounds/settings-battlegrounds.component';
import { SettingsCollectionMenuComponent } from '../../components/settings/collection/settings-collection-menu.component';
import { SettingsCollectionNotificationComponent } from '../../components/settings/collection/settings-collection-notification';
import { SettingsCollectionComponent } from '../../components/settings/collection/settings-collection.component';
import { SettingsBroadcastComponent } from '../../components/settings/decktracker/settings-broadcast';
import { SettingsDecktrackerBetaComponent } from '../../components/settings/decktracker/settings-decktracker-beta.component';
import { SettingsDecktrackerGlobalComponent } from '../../components/settings/decktracker/settings-decktracker-global';
import { SettingsDecktrackerLaunchComponent } from '../../components/settings/decktracker/settings-decktracker-launch';
import { SettingsDecktrackerMenuComponent } from '../../components/settings/decktracker/settings-decktracker-menu.component';
import { SettingsDecktrackerOpponentDeckComponent } from '../../components/settings/decktracker/settings-decktracker-opponent-deck';
import { SettingsDecktrackerTurnTimerComponent } from '../../components/settings/decktracker/settings-decktracker-turn-timer.component';
import { SettingsDecktrackerYourDeckComponent } from '../../components/settings/decktracker/settings-decktracker-your-deck';
import { SettingsDecktrackerComponent } from '../../components/settings/decktracker/settings-decktracker.component';
import { LocalizationDropdownComponent } from '../../components/settings/general/localization-dropdown.component';
import { SettingsGeneralBugReportComponent } from '../../components/settings/general/settings-general-bug-report.component';
import { SettingsGeneralDataComponent } from '../../components/settings/general/settings-general-data.component';
import { SettingsGeneralLaunchComponent } from '../../components/settings/general/settings-general-launch.component';
import { SettingsGeneralLocalizationComponent } from '../../components/settings/general/settings-general-localization.component';
import { SettingsGeneralMenuComponent } from '../../components/settings/general/settings-general-menu.component';
import { SettingsGeneralQuestsComponent } from '../../components/settings/general/settings-general-quests.component';
import { SettingsGeneralThirdPartyComponent } from '../../components/settings/general/settings-general-third-party.component';
import { SettingsGeneralComponent } from '../../components/settings/general/settings-general.component';
import { SettingsMercenariesGeneralComponent } from '../../components/settings/mercenaries/settings-mercenaries-general.component';
import { SettingsMercenariesMenuComponent } from '../../components/settings/mercenaries/settings-mercenaries-menu.component';
import { SettingsMercenariesQuestsComponent } from '../../components/settings/mercenaries/settings-mercenaries-quests.component';
import { SettingsMercenariesComponent } from '../../components/settings/mercenaries/settings-mercenaries.component';
import { ModalVideoSettingsChangedComponent } from '../../components/settings/modal/modal-video-settings-changed.component';
import { SettingsModalComponent } from '../../components/settings/modal/settings-modal.component';
import { PreferenceSliderComponent } from '../../components/settings/preference-slider.component';
import { SettingsReplaysGeneralComponent } from '../../components/settings/replays/settings-replays-general.component';
import { SettingsReplaysMenuComponent } from '../../components/settings/replays/settings-replays-menu.component';
import { SettingsReplaysComponent } from '../../components/settings/replays/settings-replays.component';
import { SettingsAdvancedToggleComponent } from '../../components/settings/settings-advanced-toggle.component';
import { SettingsAppSelectionComponent } from '../../components/settings/settings-app-selection.component';
import { SettingsComponent } from '../../components/settings/settings.component';
import { StatsXpSeasonFilterDropdownComponent } from '../../components/stats/desktop/filters/stats-xp-season-filter-dropdown.component';
import { StatsFiltersComponent } from '../../components/stats/desktop/filters/_stats-filters.component';
import { StatsDesktopComponent } from '../../components/stats/desktop/stats-desktop.component';
import { StatsXpGraphComponent } from '../../components/stats/desktop/stats-xp-graph.component';
import {
	LiveStreamInfoComponent,
	StreamHeroInfosComponent,
} from '../../components/streams/desktop/live-stream-info.component';
import { LiveStreamsComponent } from '../../components/streams/desktop/live-streams.component';
import { StreamsDesktopComponent } from '../../components/streams/desktop/streams-desktop.component';
import { OutOfCardsCallbackComponent } from '../../components/third-party/out-of-cards-callback.component';
import { AchievementsManager } from '../../services/achievement/achievements-manager.service';
import { AchievementsMonitor } from '../../services/achievement/achievements-monitor.service';
import { AchievementsNotificationService } from '../../services/achievement/achievements-notification.service';
import { RemoteAchievementsService } from '../../services/achievement/remote-achievements.service';
import { TemporaryResolutionOverrideService } from '../../services/achievement/temporary-resolution-override-service';
import { AdService } from '../../services/ad.service';
import { ApiRunner } from '../../services/api-runner';
import { AppBootstrapService } from '../../services/app-bootstrap.service';
import { setAppInjector } from '../../services/app-injector';
import { ArenaStateBuilderService } from '../../services/arena/arena-state-builder.service';
import { BgsBattlePositioningService } from '../../services/battlegrounds/bgs-battle-positioning.service';
import { BgsBattleSimulationService } from '../../services/battlegrounds/bgs-battle-simulation.service';
import { BgsBestUserStatsService } from '../../services/battlegrounds/bgs-best-user-stats.service';
import { BgsCustomSimulationService } from '../../services/battlegrounds/bgs-custom-simulation-service.service';
import { BgsGlobalStatsService } from '../../services/battlegrounds/bgs-global-stats.service';
import { BgsInitService } from '../../services/battlegrounds/bgs-init.service';
import { BattlegroundsQuestsService } from '../../services/battlegrounds/bgs-quests.service';
import { BgsRunStatsService } from '../../services/battlegrounds/bgs-run-stats.service';
import { BattlegroundsStoreService } from '../../services/battlegrounds/store/battlegrounds-store.service';
import { RealTimeStatsService } from '../../services/battlegrounds/store/real-time-stats/real-time-stats.service';
import { CardsFacadeService } from '../../services/cards-facade.service';
import { CardsInitService } from '../../services/cards-init.service';
import { CardNotificationsService } from '../../services/collection/card-notifications.service';
import { CardsMonitorService } from '../../services/collection/cards-monitor.service';
import { PackMonitor } from '../../services/collection/pack-monitor.service';
import { PackStatsService } from '../../services/collection/pack-stats.service';
import { AiDeckService } from '../../services/decktracker/ai-deck-service.service';
import { ArenaRunParserService } from '../../services/decktracker/arena-run-parser.service';
import { ConstructedMetaDecksStateBuilderService } from '../../services/decktracker/constructed-meta-decks-state-builder.service';
import { DeckCardService } from '../../services/decktracker/deck-card.service';
import { DeckParserService } from '../../services/decktracker/deck-parser.service';
import { DynamicZoneHelperService } from '../../services/decktracker/dynamic-zone-helper.service';
import { DeckManipulationHelper } from '../../services/decktracker/event-parser/deck-manipulation-helper';
import { SecretsParserService } from '../../services/decktracker/event-parser/secrets/secrets-parser.service';
import { GameStateMetaInfoService } from '../../services/decktracker/game-state-meta-info.service';
import { GameStateService } from '../../services/decktracker/game-state.service';
import { DecksProviderService } from '../../services/decktracker/main/decks-provider.service';
import { DecktrackerStateLoaderService } from '../../services/decktracker/main/decktracker-state-loader.service';
import { ReplaysStateBuilderService } from '../../services/decktracker/main/replays-state-builder.service';
import { OverlayDisplayService } from '../../services/decktracker/overlay-display.service';
import { SecretConfigService } from '../../services/decktracker/secret-config.service';
import { ZoneOrderingService } from '../../services/decktracker/zone-ordering.service';
import { DevService } from '../../services/dev.service';
import { DuelsDecksProviderService } from '../../services/duels/duels-decks-provider.service';
import { DuelsLootParserService } from '../../services/duels/duels-loot-parser.service';
import { DuelsRewardsService } from '../../services/duels/duels-rewards.service';
import { DuelsRunIdService } from '../../services/duels/duels-run-id.service';
import { DuelsStateBuilderService } from '../../services/duels/duels-state-builder.service';
import { GameEventsEmitterService } from '../../services/game-events-emitter.service';
import { GameEvents } from '../../services/game-events.service';
import { GameModeDataService } from '../../services/game-mode-data.service';
import { GameStatusService } from '../../services/game-status.service';
import { GameNativeStateStoreService } from '../../services/game/game-native-state-store.service';
import { GlobalStatsNotifierService } from '../../services/global-stats/global-stats-notifier.service';
import { GlobalStatsService } from '../../services/global-stats/global-stats.service';
import { LazyDataInitService } from '../../services/lazy-data-init.service';
import { LocalStorageService } from '../../services/local-storage';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { LocalizationService } from '../../services/localization.service';
import { LogListenerService } from '../../services/log-listener.service';
import { LogRegisterService } from '../../services/log-register.service';
import { LogsUploaderService } from '../../services/logs-uploader.service';
import { LiveStreamsService } from '../../services/mainwindow/live-streams.service';
import { OutOfCardsService } from '../../services/mainwindow/out-of-cards.service';
import { CollaboratorsService } from '../../services/mainwindow/store/collaborators.service';
import { CollectionBootstrapService } from '../../services/mainwindow/store/collection-bootstrap.service';
import { AchievementUpdateHelper } from '../../services/mainwindow/store/helper/achievement-update-helper';
import { MainWindowStoreService } from '../../services/mainwindow/store/main-window-store.service';
import { StoreBootstrapService } from '../../services/mainwindow/store/store-bootstrap.service';
import { TwitchAuthService } from '../../services/mainwindow/twitch-auth.service';
import { TwitchPresenceService } from '../../services/mainwindow/twitch-presence.service';
import { EndGameListenerService } from '../../services/manastorm-bridge/end-game-listener.service';
import { EndGameUploaderService } from '../../services/manastorm-bridge/end-game-uploader.service';
import { GameParserService } from '../../services/manastorm-bridge/game-parser.service';
import { ReplayUploadService } from '../../services/manastorm-bridge/replay-upload.service';
import { MercenariesSynergiesHighlightService } from '../../services/mercenaries/highlights/mercenaries-synergies-highlight.service';
import { MercenariesMemoryCacheService } from '../../services/mercenaries/mercenaries-memory-cache.service';
import { MercenariesMemoryUpdateService } from '../../services/mercenaries/mercenaries-memory-updates.service';
import { MercenariesStateBuilderService } from '../../services/mercenaries/mercenaries-state-builder.service';
import { MercenariesStoreService } from '../../services/mercenaries/mercenaries-store.service';
import { MercenariesOutOfCombatService } from '../../services/mercenaries/out-of-combat/mercenaries-out-of-combat.service';
import { OwNotificationsService } from '../../services/notifications.service';
import { PatchesConfigService } from '../../services/patches-config.service';
import { GameEventsPluginService } from '../../services/plugins/game-events-plugin.service';
import { SimpleIOService } from '../../services/plugins/simple-io.service';
import { QuestsService } from '../../services/quests.service';
import { RealTimeNotificationService } from '../../services/real-time-notifications.service';
import { ReplaysNotificationService } from '../../services/replays/replays-notification.service';
import { ReviewIdService } from '../../services/review-id.service';
import { RewardMonitorService } from '../../services/rewards/rewards-monitor';
import { S3FileUploadService } from '../../services/s3-file-upload.service';
import { SettingsCommunicationService } from '../../services/settings/settings-communication.service';
import { GameStatsLoaderService } from '../../services/stats/game/game-stats-loader.service';
import { GameStatsProviderService } from '../../services/stats/game/game-stats-provider.service';
import { GameStatsUpdaterService } from '../../services/stats/game/game-stats-updater.service';
import { StatsStateBuilderService } from '../../services/stats/stats-state-builder.service';
import { TipService } from '../../services/tip.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AppUiStoreService } from '../../services/ui-store/app-ui-store.service';
import { UserService } from '../../services/user.service';
import { SharedDeckTrackerModule } from '../shared-decktracker/shared-dectracker.module';
import { SharedServicesModule } from '../shared-services/shared-services.module';
import { SharedModule } from '../shared/shared.module';

declare let overwolf: any;

console.log('version is ' + process.env.APP_VERSION);
console.log('environment is ' + process.env.NODE_ENV);
console.log('is local test? ' + process.env.LOCAL_TEST);

overwolf.settings.getExtensionSettings((settings) => {
	const sampleRate = settings?.settings?.channel === 'beta' ? 1 : 0.1;
	process.env.APP_CHANNEL = settings?.settings?.channel;
	console.log('init Sentry with sampleRate', sampleRate, settings?.settings?.channel, settings);
	init({
		dsn: 'https://53b0813bb66246ae90c60442d05efefe@o92856.ingest.sentry.io/1338840',
		enabled: process.env.NODE_ENV === 'production',
		release: process.env.APP_VERSION,
		attachStacktrace: true,
		sampleRate: sampleRate,
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
});

if (process.env.LOCAL_TEST) {
	console.error('LOCAL_TEST is true, this should never happen in prod');
}

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
	handleError(error) {
		console.log('capturing error', error);
		const originalError = error.originalError ?? error;
		captureException(originalError);
		throw error;
	}
}

const components = [
	AppComponent,
	MainWindowComponent,
	LoadingComponent,
	NotificationsComponent,
	BattlegroundsComponent,
	FullScreenOverlaysComponent,
	FullScreenOverlaysClickthroughComponent,
	BattlegroundsMinionsTiersOverlayComponent,
	BattlegroundsOverlayButtonComponent,
	BgsBannedTribesComponent,
	BgsSimulationOverlayComponent,
	BgsHeroSelectionOverlayComponent,
	// ConstructedComponent,
	DeckTrackerOverlayPlayerComponent,
	DeckTrackerOverlayOpponentComponent,
	GameCountersComponent,
	OpponentHandOverlayComponent,
	OutOfCardsCallbackComponent,
	SecretsHelperComponent,

	MercenariesOpponentTeamComponent,
	MercenariesPlayerTeamComponent,
	MercenariesActionsQueueComponent,
	MercenariesOutOfCombatPlayerTeamComponent,
	MercenariesOutOfCombatTreasureSelectionComponent,

	SettingsComponent,
];

@NgModule({
	imports: [
		AngularResizedEventModule,
		A11yModule,
		BrowserAnimationsModule,
		BrowserModule,
		ChartsModule,
		ColiseumComponentsModule,
		DragDropModule,
		FormsModule,
		HttpClientModule,
		InlineSVGModule.forRoot(),
		NgxChartsModule,
		OverlayModule,
		PerfectScrollbarModule,
		ReactiveFormsModule,
		// ScrollingModule,
		SharedModule,
		SharedDeckTrackerModule,
		SharedServicesModule.forRoot(),
		SelectModule,
		SimpleNotificationsModule.forRoot(),
		VirtualScrollerModule,
	],
	declarations: [
		...components,

		GlobalHeaderComponent,

		BattlegroundsContentComponent,
		BgsHeroSelectionOverviewComponent,
		// BgsHeroWarbandStatsComponent,
		MenuSelectionBgsComponent,
		BgsTavernMinionComponent,
		BgsBannedTribeComponent,
		GraphWithSingleValueComponent,
		BgsBattlesComponent,
		BgsSimulatorHeroSelectionComponent,
		BgsSimulatorHeroPowerSelectionComponent,
		BgsSimulatorQuestRewardSelectionComponent,
		BgsSimulatorMinionSelectionComponent,
		BattlegroundsSimulatorMinionTribeFilterDropdownComponent,
		BattlegroundsSimulatorMinionTierFilterDropdownComponent,
		CurrentSessionBgsBoardTooltipComponent,

		// ConstructedComponent,
		// ConstructedContentComponent,
		// InGameAchievementsRecapComponent,
		// InGameAchievementRecapComponent,
		// InGameOpponentRecapComponent,
		// ConstructedMenuSelectionComponent,

		CurrentSessionWidgetComponent,
		TurnTimerWidgetComponent,
		TurnTimerPlayerComponent,
		DuelsMaxLifeWidgetComponent,

		GenericCountersComponent,

		OpponentHandOverlayComponent,
		OpponentCardInfosComponent,
		OpponentCardInfoComponent,
		OpponentCardInfoIdComponent,
		OpponentCardTurnNumberComponent,

		SecretsHelperControlBarComponent,
		SecretsHelperComponent,
		SecretsHelperWidgetIconComponent,

		AutocompleteSearchWithListComponent,
		SearchAutocompleteItemComponent,

		CardComponent,
		CardHistoryComponent,
		CardHistoryItemComponent,
		SetStatsComponent,
		SetStatCellComponent,
		CardsComponent,
		CardSearchComponent,
		CollectionComponent,
		CollectionMenuSelectionComponent,
		CollectionEmptyStateComponent,
		FullCardComponent,
		MainWindowComponent,
		MenuSelectionComponent,
		RarityComponent,
		SetComponent,
		SetsComponent,
		SetsContainerComponent,
		CardBacksComponent,
		CardBackComponent,
		FullCardBackComponent,
		HeroPortraitsComponent,
		HeroPortraitComponent,
		TheCoinsComponent,
		CollectionPackStatsComponent,
		PackHistoryComponent,
		PackHistoryItemComponent,
		PackDisplayComponent,

		CollectionHeroPortraitOwnedFilterDropdownComponent,
		CollectionHeroPortraitCategoriesFilterDropdownComponent,
		CollectionCardRarityFilterDropdownComponent,
		CollectionCardClassFilterDropdownComponent,
		CollectionCardOwnedFilterDropdownComponent,
		OwnedFilterComponent,

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
		AchievementsCompletedFilterDropdownComponent,

		DecktrackerComponent,
		DecktrackerDecksComponent,
		DecktrackerDeckDragTemplateComponent,
		DecktrackerDeckSummaryComponent,
		DecktrackerDeckDetailsComponent,
		ConstructedMetaDecksComponent,
		ConstructedMetaDeckSummaryComponent,
		DeckWinrateMatrixComponent,
		DeckMatchupInfoComponent,
		DecktrackerDeckRecapComponent,
		DeckManaCurveComponent,
		DeckManaCurveBarComponent,
		DecktrackerReplaysRecapComponent,
		DecktrackerLadderStatsComponent,
		DecktrackerLadderStatsOverviewComponent,
		DecktrackerLadderStatsMatchupsComponent,
		DecktrackerStatsForReplaysComponent,
		MenuSelectionDecktrackerComponent,
		DecktrackerRatingGraphComponent,
		DecktrackerFiltersComponent,
		DecktrackerFormatFilterDropdownComponent,
		DecktrackerTimeFilterDropdownComponent,
		DecktrackerRankFilterDropdownComponent,
		DecktrackerDeckSortDropdownComponent,
		DecktrackerRankGroupDropdownComponent,
		DecktrackerRankCategoryDropdownComponent,
		ConstructedDeckbuilderComponent,
		ConstructedDeckbuilderBreadcrumbsComponent,
		ConstructedDeckbuilderFormatComponent,
		ConstructedDeckbuilderClassComponent,
		ConstructedDeckbuilderCardsComponent,
		ConstructedRankFilterDropdownComponent,
		ConstructedFormatFilterDropdownComponent,
		ConstructedTimeFilterDropdownComponent,
		ConstructedMyDecksSearchComponent,

		ReplaysComponent,
		ReplaysListComponent,
		ReplaysListViewComponent,
		// ReplaysFilterComponent,
		GroupedReplaysComponent,
		ReplayInfoComponent,
		ReplayInfoRankedComponent,
		ReplayInfoBattlegroundsComponent,
		ReplayInfoMercenariesComponent,
		ReplayInfoMercPlayerComponent,
		ReplayInfoDuelsComponent,
		ReplayInfoGenericComponent,
		MatchDetailsComponent,
		GameReplayComponent,
		RankImageComponent,
		ReplayIconToggleComponent,
		ReplayMercDetailsToggleComponent,
		ReplaysGameModeFilterDropdownComponent,
		ReplaysDeckstringFilterDropdownComponent,
		ReplaysBgHeroFilterDropdownComponent,
		ReplaysPlayerClassFilterDropdownComponent,
		ReplaysOpponentClassFilterDropdownComponent,
		RegionFilterDropdownComponent,

		BattlegroundsDesktopComponent,
		BattlegroundsCategoryDetailsComponent,
		BattlegroundsDesktopOverviewComponent,
		BattlegroundsPersonalStatsHeroesComponent,
		BattlegroundsPersonalStatsQuestsComponent,
		BattlegroundsStatsHeroVignetteComponent,
		BattlegroundsStatsQuestVignetteComponent,
		BattlegroundsPersonalStatsRatingComponent,
		BattlegroundsPerfectGamesComponent,
		BattlegroundsSimulatorComponent,
		BattlegroundsPersonalStatsStatsComponent,
		BattlegroundsPersonalStatsHeroDetailsComponent,
		BattlegroundsTierListComponent,
		BattlegroundsQuestsTierListComponent,
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
		BattlegroundsFiltersComponent,
		BattlegroundsHeroSortDropdownComponent,
		BattlegroundsHeroFilterDropdownComponent,
		BattlegroundsRankFilterDropdownComponent,
		BattlegroundsTribesFilterDropdownComponent,
		BattlegroundsRankGroupDropdownComponent,
		BattlegroundsTimeFilterDropdownComponent,

		DuelsDesktopComponent,
		DuelsEmptyStateComponent,
		DuelsRunsListComponent,
		DuelsRunComponent,
		// LootInfoComponent,
		LootBundleComponent,
		DuelsHeroStatsComponent,
		DuelsHeroStatVignetteComponent,
		DuelsGlobalValueComponent,
		DuelsTreasureStatsComponent,
		// DuelsTreasureStatVignetteComponent,
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
		DuelsLeaderboardComponent,
		DuelsDeckbuilderComponent,
		DuelsDeckbuilderBreadcrumbsComponent,
		DuelsDeckbuilderCardsComponent,
		DuelsDeckbuilderHeroComponent,
		DuelsDeckbuilderHeroPowerComponent,
		DuelsDeckbuilderSignatureTreasureComponent,
		DuelsBucketsComponent,
		DuelsBucketCardsListComponent,
		DuelsBucketCardComponent,
		DuelsFiltersComponent,
		DuelsGameModeFilterDropdownComponent,
		DuelsTreasuresSortDropdownComponent,
		DuelsStatTypeFilterDropdownComponent,
		DuelsTreasurePassiveTypeFilterDropdownComponent,
		DuelsHeroSortDropdownComponent,
		DuelsDeckSortDropdownComponent,
		DuelsTimeFilterDropdownComponent,
		DuelsHeroFilterDropdownComponent,
		DuelsPassiveFilterDropdownComponent,
		DuelsDustFilterDropdownComponent,
		DuelsMmrFilterDropdownComponent,
		DuelsLeaderboardGameModeFilterDropdownComponent,
		DuelsHeroPowerFilterDropdownComponent,
		DuelsSignatureTreasureFilterDropdownComponent,

		ArenaDesktopComponent,
		ArenaEmptyStateComponent,
		ArenaRunsListComponent,
		ArenaRunComponent,
		ArenaClassesRecapComponent,
		ArenaFiltersComponent,
		ArenaTimeFilterDropdownComponent,
		ArenaClassFilterDropdownComponent,

		MercenariesOpponentTeamComponent,
		MercenariesTeamRootComponent,
		MercenariesTeamControlBarComponent,
		MercenariesTeamListComponent,
		MercenariesTeamMercenaryComponent,
		MercsTasksListComponent,

		MercenariesDesktopComponent,
		MercenariesPersonalHeroStatsComponent,
		MercenariesPersonalHeroStatComponent,
		MercenariesMyTeamsComponent,
		MercenariesPersonalTeamSummaryComponent,
		MercenariesCompositionsStatsComponent,
		MercenariesCompositionStatComponent,
		MercenariesComposiionDetailsComponent,
		MercenariesHeroSearchComponent,
		MercenariesEmptyStateComponent,
		MercenariesTeamAbilityComponent,
		MercenariesActionComponent,
		MercenariesHeroDetailsComponent,

		// Not used for now
		MercenariesMetaHeroStatsComponent,
		MercenariesMetaHeroStatComponent,
		MercenariesMetaHeroDetailsComponent,

		SortableLabelComponent,
		MercenariesFiltersComponent,
		MercenariesModeFilterDropdownComponent,
		MercenariesRoleFilterDropdownComponent,
		MercenariesPveDifficultyFilterDropdownComponent,
		MercenariesPvpMmrFilterDropdownComponent,
		MercenariesStarterFilterDropdownComponent,
		MercenariesHeroLevelFilterDropdownComponent,
		MercenariesFullyUpgradedFilterDropdownComponent,
		MercenariesOwnedFilterDropdownComponent,

		StreamsDesktopComponent,
		LiveStreamsComponent,
		LiveStreamInfoComponent,
		StreamHeroInfosComponent,

		StatsDesktopComponent,
		StatsXpGraphComponent,
		StatsFiltersComponent,
		StatsXpSeasonFilterDropdownComponent,

		DecktrackerPlayerWidgetWrapperComponent,
		DecktrackerOpponentWidgetWrapperComponent,
		SecretsHelperWidgetWrapperComponent,
		OpponentHandWidgetWrapperComponent,
		ConstructedBoardWidgetWrapperComponent,
		PlayerHeroPowerWidgetWrapperComponent,
		CurrentSessionWidgetWrapperComponent,
		TurnTimerWidgetWrapperComponent,
		MinionOnBoardOverlayComponent,
		HeroPowerOverlayComponent,
		QuestsWidgetViewComponent,
		HsQuestsWidgetComponent,
		HsQuestsListWidgetComponent,
		HsQuestsWidgetWrapperComponent,
		BgsQuestsWidgetComponent,
		BgsQuestsWidgetWrapperComponent,
		MercsQuestsWidgetComponent,
		MercsQuestsWidgetWrapperComponent,
		ChoosingCardWidgetWrapperComponent,
		ChoosingCardOptionComponent,

		DuelsMaxLifeOpponentWidgetWrapperComponent,
		DuelsDecktrackerOocWidgetWrapperComponent,
		DuelsDecktrackerOocComponent,
		DuelsOutOfCombatTreasureSelectionWidgetWrapperComponent,
		DuelsOutOfCombatTreasureSelectionComponent,
		DuelsOutOfCombatHeroSelectionWidgetWrapperComponent,
		DuelsOutOfCombatHeroSelectionComponent,
		DuelsHeroInfoComponent,
		DuelsOutOfCombatHeroPowerSelectionWidgetWrapperComponent,
		DuelsOutOfCombatHeroPowerSelectionComponent,
		DuelsHeroPowerInfoComponent,
		DuelsOutOfCombatSignatureTreasureSelectionWidgetWrapperComponent,
		DuelsOutOfCombatSignatureTreasureSelectionComponent,
		DuelsSignatureTreasureInfoComponent,
		DuelsOocDeckSelectWidgetWrapperComponent,
		DuelsOutOfCombatDeckSelectComponent,
		DuelsDeckWidgetComponent,

		BgsMinionsTiersWidgetWrapperComponent,
		BgsBattleSimulationWidgetWrapperComponent,
		BgsBannedTribesWidgetWrapperComponent,
		BgsWindowButtonWidgetWrapperComponent,
		BgsHeroSelectionWidgetWrapperComponent,
		BgsLeaderboardWidgetWrapperComponent,
		BgsBoardWidgetWrapperComponent,

		MercsPlayerTeamWidgetWrapperComponent,
		MercsOpponentTeamWidgetWrapperComponent,
		MercsActionQueueWidgetWrapperComponent,
		MercsOutOfCombatPlayerTeamWidgetWrapperComponent,
		MercsTreasureSelectionWidgetWrapperComponent,

		AbstractCounterWidgetWrapperComponent,
		PlayerCounterWidgetWrapperComponent,
		PlayerWatchpostCounterWidgetWrapperComponent,
		PlayerSpellWidgetWrapperComponent,
		PlayerPogoWidgetWrapperComponent,
		PlayerLibramWidgetWrapperComponent,
		PlayerJadeWidgetWrapperComponent,
		PlayerHeroPowerDamageWidgetWrapperComponent,
		PlayerGalakrondWidgetWrapperComponent,
		PlayerFatigueWidgetWrapperComponent,
		PlayerAbyssalCurseWidgetWrapperComponent,
		PlayerElwynnBoarWidgetWrapperComponent,
		PlayerVolatileSkeletonWidgetWrapperComponent,
		PlayerRelicWidgetWrapperComponent,
		PlayerElementalWidgetWrapperComponent,
		PlayerCthunWidgetWrapperComponent,
		PlayerBolnerWidgetWrapperComponent,
		PlayerBrilliantMacawWidgetWrapperComponent,
		PlayerMonstrousParrotWidgetWrapperComponent,
		PlayerVanessaVanCleefWidgetWrapperComponent,
		PlayerMurozondTheInfiniteWidgetWrapperComponent,
		PlayerLadyDarkveinWidgetWrapperComponent,
		PlayerGreySageParrotWidgetWrapperComponent,
		PlayerMulticasterWidgetWrapperComponent,
		PlayerCoralKeeperWidgetWrapperComponent,
		PlayerBgsSouthseaWidgetWrapperComponent,
		PlayerBgsMajordomoWidgetWrapperComponent,

		OpponentCounterWidgetWrapperComponent,
		OpponentWatchpostCounterWidgetWrapperComponent,
		OpponentPogoWidgetWrapperComponent,
		OpponentJadeWidgetWrapperComponent,
		OpponentGalakrondWidgetWrapperComponent,
		OpponentFatigueWidgetWrapperComponent,
		OpponentAbyssalCurseWidgetWrapperComponent,
		OpponentHeroPowerDamageWidgetWrapperComponent,
		OpponentElwynnBoarWidgetWrapperComponent,
		OpponentVolatileSkeletonWidgetWrapperComponent,
		OpponentRelicWidgetWrapperComponent,
		OpponentCthunWidgetWrapperComponent,
		OpponentLibramWidgetWrapperComponent,

		FtueComponent,
		NewVersionNotificationComponent,

		SettingsAppSelectionComponent,
		SettingsAdvancedToggleComponent,

		SettingsGeneralComponent,
		SettingsGeneralMenuComponent,
		SettingsGeneralLaunchComponent,
		SettingsGeneralLocalizationComponent,
		SettingsGeneralBugReportComponent,
		SettingsGeneralThirdPartyComponent,
		SettingsGeneralDataComponent,
		SettingsGeneralQuestsComponent,

		SettingsCollectionComponent,
		SettingsCollectionMenuComponent,
		SettingsCollectionNotificationComponent,

		SettingsAchievementsComponent,
		SettingsAchievementsMenuComponent,
		SettingsAchievementsNotificationsComponent,
		SettingsAchievementsLiveComponent,
		SettingsModalComponent,
		ModalVideoSettingsChangedComponent,

		SettingsDecktrackerComponent,
		SettingsDecktrackerMenuComponent,
		SettingsDecktrackerLaunchComponent,
		SettingsDecktrackerYourDeckComponent,
		SettingsDecktrackerOpponentDeckComponent,
		SettingsDecktrackerGlobalComponent,
		SettingsBroadcastComponent,
		SettingsDecktrackerBetaComponent,
		SettingsDecktrackerDuelsComponent,
		SettingsDecktrackerTurnTimerComponent,

		SettingsReplaysComponent,
		SettingsReplaysGeneralComponent,
		SettingsReplaysMenuComponent,

		SettingsBattlegroundsComponent,
		SettingsBattlegroundsGeneralComponent,
		SettingsBattlegroundsOverlayComponent,
		SettingsBattlegroundsSessionComponent,
		SettingsBattlegroundsMenuComponent,

		SettingsMercenariesComponent,
		SettingsMercenariesMenuComponent,
		SettingsMercenariesGeneralComponent,
		SettingsMercenariesQuestsComponent,

		PreferenceSliderComponent,
		LocalizationDropdownComponent,

		AdvancedSettingDirective,
		MercenariesHighlightDirective,
		AutofocusDirective,
	],
	entryComponents: [
		BgsCardTooltipComponent,
		TwitchBgsHeroOverviewComponent,
		BgsSimulatorHeroSelectionComponent,
		BgsSimulatorMinionSelectionComponent,
		BgsSimulatorHeroPowerSelectionComponent,
		BgsSimulatorQuestRewardSelectionComponent,
		CurrentSessionBgsBoardTooltipComponent,
		...components,
	],
	providers: [
		{ provide: ErrorHandler, useClass: SentryErrorHandler },
		AppBootstrapService,
		RealTimeNotificationService,
		AdService,
		TipService,
		MainWindowStoreService,
		StoreBootstrapService,
		CollaboratorsService,
		UserService,
		ApiRunner,
		LocalStorageService,
		LazyDataInitService,
		GameStatusService,
		QuestsService,
		LiveStreamsService,

		AppUiStoreService,
		AppUiStoreFacadeService,
		LocalizationService,
		LocalizationFacadeService,
		CardsInitService,
		CardsFacadeService,
		RefCards,
		// For coliseum-components
		{ provide: AllCardsService, useExisting: CardsFacadeService },

		DevService,
		GameEvents,
		GameEventsEmitterService,
		GameEventsPluginService,
		GameModeDataService,
		LogListenerService,
		CardsMonitorService,
		LogRegisterService,
		SettingsCommunicationService,
		TwitchAuthService,
		TwitchPresenceService,
		OutOfCardsService,
		GameNativeStateStoreService,

		CollectionBootstrapService,
		PackMonitor,
		PackStatsService,
		CardNotificationsService,

		AchievementsMonitor,
		AchievementsNotificationService,
		RemoteAchievementsService,
		AchievementsManager,
		AchievementUpdateHelper,

		DecktrackerStateLoaderService,
		DecksProviderService,
		ReplaysStateBuilderService,
		ConstructedMetaDecksStateBuilderService,

		EndGameListenerService,
		EndGameUploaderService,
		GameParserService,
		ReplayUploadService,
		SecretsParserService,
		GameStateService,
		DeckManipulationHelper,
		AttackOnBoardService,

		BattlegroundsStoreService,
		BgsInitService,
		BgsGlobalStatsService,
		BattlegroundsQuestsService,
		BgsBattleSimulationService,
		BgsBattlePositioningService,
		BgsRunStatsService,
		BgsBestUserStatsService,
		RealTimeStatsService,
		BgsCustomSimulationService,
		BgsSimulatorKeyboardControls,

		MercenariesMemoryUpdateService,
		MercenariesMemoryCacheService,
		MercenariesStoreService,
		MercenariesOutOfCombatService,

		AiDeckService,
		SecretConfigService,
		PatchesConfigService,

		GameStatsLoaderService,
		GameStatsUpdaterService,
		GameStatsProviderService,

		OverlayDisplayService,
		DeckCardService,
		DeckParserService,
		DuelsLootParserService,
		DuelsRewardsService,
		DuelsRunIdService,
		DuelsDecksProviderService,
		ReviewIdService,
		ArenaRunParserService,
		GameStateService,
		DynamicZoneHelperService,
		ZoneOrderingService,
		GameStateMetaInfoService,

		DuelsStateBuilderService,
		DuelsMemoryCacheService,

		ArenaStateBuilderService,

		MercenariesStateBuilderService,
		MercenariesSynergiesHighlightService,

		StatsStateBuilderService,

		GlobalStatsService,
		GlobalStatsNotifierService,

		ReplaysNotificationService,
		RewardMonitorService,

		TemporaryResolutionOverrideService,
		LogsUploaderService,
		S3FileUploadService,
		OwNotificationsService,
		SimpleIOService,
	],
	// bootstrap: [],
})
export class AppModule implements DoBootstrap {
	constructor(private resolver: ComponentFactoryResolver, private injector: Injector) {
		setAppInjector(injector);
	}

	ngDoBootstrap(appRef: ApplicationRef) {
		components.forEach((componentDef: Type<any>) => {
			const factory = this.resolver.resolveComponentFactory(componentDef);
			if (document.querySelector(factory.selector)) {
				appRef.bootstrap(factory);
			}
		});
	}
}
