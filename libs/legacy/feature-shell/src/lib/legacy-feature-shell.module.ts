import { A11yModule } from '@angular/cdk/a11y';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayContainer, OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ErrorHandler, Injectable, Injector, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PieChartComponent } from '@components/common/chart/pie-chart.component';
import { ColiseumComponentsModule } from '@firestone-hs/coliseum-components';
import { AllCardsService as RefCards } from '@firestone-hs/reference-data';
import { NgxChartsModule } from '@sebastientromp/ngx-charts';
import { captureException, init, Integrations } from '@sentry/browser';
import { CaptureConsole, ExtraErrorData } from '@sentry/integrations';
import { SimpleNotificationsModule } from 'angular2-notifications';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { SelectModule } from 'ng-select';
import { NgChartsModule } from 'ng2-charts';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';
import { AchievementCategoryComponent } from './js/components/achievements/achievement-category.component';
import { AchievementCompletionStepComponent } from './js/components/achievements/achievement-completion-step.component';
import { AchievementHistoryItemComponent } from './js/components/achievements/achievement-history-item.component';
import { AchievementHistoryComponent } from './js/components/achievements/achievement-history.component';
import { AchievementImageComponent } from './js/components/achievements/achievement-image.component';
import { AchievementProgressBarComponent } from './js/components/achievements/achievement-progress-bar.component';
import { AchievementViewComponent } from './js/components/achievements/achievement-view.component';
import { AchievementsCategoriesComponent } from './js/components/achievements/achievements-categories.component';
import { AchievementsFilterComponent } from './js/components/achievements/achievements-filter.component.ts';
import { AchievementsListComponent } from './js/components/achievements/achievements-list.component';
import { AchievementsComponent } from './js/components/achievements/achievements.component';
import { AchievementsCompletedFilterDropdownComponent } from './js/components/achievements/filters/achievements-completed-filter-dropdown.component';
import { ArenaClassesRecapComponent } from './js/components/arena/desktop/arena-classes-recap.component';
import { ArenaDesktopComponent } from './js/components/arena/desktop/arena-desktop.component';
import { ArenaEmptyStateComponent } from './js/components/arena/desktop/arena-empty-state.component';
import { ArenaRunComponent } from './js/components/arena/desktop/arena-run.component';
import { ArenaRunsListComponent } from './js/components/arena/desktop/arena-runs-list.component';
import { ArenaClassFilterDropdownComponent } from './js/components/arena/desktop/filters/arena-class-filter-dropdown.component';
import { ArenaTimeFilterDropdownComponent } from './js/components/arena/desktop/filters/arena-time-filter-dropdown.component';
import { ArenaFiltersComponent } from './js/components/arena/desktop/filters/_arena-filters.component';
import { BattlegroundsContentComponent } from './js/components/battlegrounds/battlegrounds-content.component';
import { BattlegroundsEmptyStateComponent } from './js/components/battlegrounds/battlegrounds-empty-state.component';
import { BattlegroundsComponent } from './js/components/battlegrounds/battlegrounds.component';
import { BgsBattlesComponent } from './js/components/battlegrounds/battles/bgs-battles.component';
import { BgsSimulatorHeroPowerSelectionComponent } from './js/components/battlegrounds/battles/bgs-simulator-hero-power-selection.component';
import { BgsSimulatorHeroSelectionComponent } from './js/components/battlegrounds/battles/bgs-simulator-hero-selection.component';
import { BgsSimulatorMinionSelectionComponent } from './js/components/battlegrounds/battles/bgs-simulator-minion-selection.component';
import { BattlegroundsSimulatorMinionTierFilterDropdownComponent } from './js/components/battlegrounds/battles/bgs-simulator-minion-tier-filter-dropdown.component';
import { BattlegroundsSimulatorMinionTribeFilterDropdownComponent } from './js/components/battlegrounds/battles/bgs-simulator-minion-tribe-filter-dropdown.component';
import { BgsSimulatorQuestRewardSelectionComponent } from './js/components/battlegrounds/battles/bgs-simulator-quest-reward-selection.component';
import { BgsBannedTribeComponent } from './js/components/battlegrounds/bgs-banned-tribe.component';
import { BgsBannedTribesComponent } from './js/components/battlegrounds/bgs-banned-tribes.component';
import { BattlegroundsCategoryDetailsComponent } from './js/components/battlegrounds/desktop/battlegrounds-category-details.component';
import { BattlegroundsDesktopComponent } from './js/components/battlegrounds/desktop/battlegrounds-desktop.component';
import { BattlegroundsDesktopOverviewComponent } from './js/components/battlegrounds/desktop/categories/battlegrounds-desktop-overview.component';
import { BattlegroundsPerfectGamesComponent } from './js/components/battlegrounds/desktop/categories/battlegrounds-perfect-games.component';
import { BattlegroundsPersonalStatsHeroDetailsComponent } from './js/components/battlegrounds/desktop/categories/battlegrounds-personal-stats-hero-details.component';
import { BattlegroundsPersonalStatsQuestsComponent } from './js/components/battlegrounds/desktop/categories/battlegrounds-personal-stats-quests.component';
import { BattlegroundsPersonalStatsRatingComponent } from './js/components/battlegrounds/desktop/categories/battlegrounds-personal-stats-rating.component';
import { BattlegroundsPersonalStatsStatsComponent } from './js/components/battlegrounds/desktop/categories/battlegrounds-personal-stats-stats.component';
import { BattlegroundsSimulatorComponent } from './js/components/battlegrounds/desktop/categories/battlegrounds-simulator.component';
import { BattlegroundsStatsQuestVignetteComponent } from './js/components/battlegrounds/desktop/categories/battlegrounds-stats-quest-vignette.component';
import {
	BgsGlobalValueComponent,
	BgsHeroDetailedStatsComponent,
} from './js/components/battlegrounds/desktop/categories/hero-details/bgs-hero-detailed-stats.component';
import { BgsLastWarbandsComponent } from './js/components/battlegrounds/desktop/categories/hero-details/bgs-last-warbands.component';
import { BgsMmrEvolutionForHeroComponent } from './js/components/battlegrounds/desktop/categories/hero-details/bgs-mmr-evolution-for-hero.component';
import { BgsWarbandStatsForHeroComponent } from './js/components/battlegrounds/desktop/categories/hero-details/bgs-warband-stats-for-hero.component';
import { BgsWinrateStatsForHeroComponent } from './js/components/battlegrounds/desktop/categories/hero-details/bgs-winrate-stats-for-hero.component';
import { BattlegroundsHeroFilterDropdownComponent } from './js/components/battlegrounds/desktop/filters/battlegrounds-hero-filter-dropdown.component';
import { BattlegroundsHeroSortDropdownComponent } from './js/components/battlegrounds/desktop/filters/battlegrounds-hero-sort-dropdown.component';
import { BattlegroundsRankFilterDropdownComponent } from './js/components/battlegrounds/desktop/filters/battlegrounds-rank-filter-dropdown.component';
import { BattlegroundsRankGroupDropdownComponent } from './js/components/battlegrounds/desktop/filters/battlegrounds-rank-group-dropdown.component';
import { BattlegroundsTimeFilterDropdownComponent } from './js/components/battlegrounds/desktop/filters/battlegrounds-time-filter-dropdown.component';
import { BattlegroundsTribesFilterDropdownComponent } from './js/components/battlegrounds/desktop/filters/battlegrounds-tribes-filter-dropdown.component';
import { BattlegroundsFiltersComponent } from './js/components/battlegrounds/desktop/filters/_battlegrounds-filters.component';
import { BattlegroundsHeroRecordsBrokenComponent } from './js/components/battlegrounds/desktop/secondary/battlegrounds-hero-records-broken.component';
import { BattlegroundsHeroesRecordsBrokenComponent } from './js/components/battlegrounds/desktop/secondary/battlegrounds-heroes-records-broken.component';
import { BattlegroundsQuestsTierListComponent } from './js/components/battlegrounds/desktop/secondary/battlegrounds-quests-tier-list.component';
import { BattlegroundsReplaysRecapComponent } from './js/components/battlegrounds/desktop/secondary/battlegrounds-replays-recap.component';
import { BattlegroundsTierListComponent } from './js/components/battlegrounds/desktop/secondary/battlegrounds-tier-list.component';
import { GraphWithSingleValueComponent } from './js/components/battlegrounds/graph-with-single-value.component';
import { BgsHeroSelectionOverviewComponent } from './js/components/battlegrounds/hero-selection/bgs-hero-selection-overview.component';
import { MenuSelectionBgsComponent } from './js/components/battlegrounds/menu-selection-bgs.component';
import { BattlegroundsMinionsTiersOverlayComponent } from './js/components/battlegrounds/minions-tiers/battlegrounds-minions-tiers.component';
import { BattlegroundsOverlayButtonComponent } from './js/components/battlegrounds/overlay/battlegrounds-overlay-button.component';
import { BgsHeroSelectionOverlayComponent } from './js/components/battlegrounds/overlay/bgs-hero-selection-overlay.component';
import { BgsTavernMinionComponent } from './js/components/battlegrounds/overlay/bgs-tavern-minion.component';
import { BgsSimulationOverlayComponent } from './js/components/battlegrounds/simulation-overlay/bgs-simulation-overlay.component';
import { CardBackComponent } from './js/components/collection/card-back.component';
import { CardBacksComponent } from './js/components/collection/card-backs.component';
import { CardHistoryItemComponent } from './js/components/collection/card-history-item.component';
import { CardHistoryComponent } from './js/components/collection/card-history.component';
import { CardSearchComponent } from './js/components/collection/card-search.component';
import { CardsComponent } from './js/components/collection/cards.component';
import { CollectionEmptyStateComponent } from './js/components/collection/collection-empty-state.component';
import { CollectionMenuSelectionComponent } from './js/components/collection/collection-menu-selection.component';
import { CollectionComponent } from './js/components/collection/collection.component';
import { CollectionCardClassFilterDropdownComponent } from './js/components/collection/filters/card-class-filter.component';
import { CollectionCardOwnedFilterDropdownComponent } from './js/components/collection/filters/card-owned-filter.component';
import { CollectionCardRarityFilterDropdownComponent } from './js/components/collection/filters/card-rarity-filter.component';
import { CollectionHeroPortraitCategoriesFilterDropdownComponent } from './js/components/collection/filters/collection-hero-portrait-categories-filter-dropdown.component';
import { CollectionHeroPortraitOwnedFilterDropdownComponent } from './js/components/collection/filters/collection-hero-portrait-owned-filter-dropdown.component';
import { OwnedFilterComponent } from './js/components/collection/filters/owned-filter.component';
import { FullCardBackComponent } from './js/components/collection/full-card-back.component';
import { FullCardComponent } from './js/components/collection/full-card.component';
import { HeroPortraitComponent } from './js/components/collection/hero-portrait.component';
import { HeroPortraitsComponent } from './js/components/collection/hero-portraits.component';
import { RarityComponent } from './js/components/collection/rarity.component';
import { SetStatCellComponent } from './js/components/collection/set-stat-cell.component';
import { SetStatsComponent } from './js/components/collection/set-stats.component';
import { SetComponent } from './js/components/collection/set.component';
import { SetsContainerComponent } from './js/components/collection/sets-container.component';
import { SetsComponent } from './js/components/collection/sets.component';
import { TheCoinsComponent } from './js/components/collection/the-coins.component';
import { SearchAutocompleteItemComponent } from './js/components/common/autocomplete-search-with-list-item.component';
import { AutocompleteSearchWithListComponent } from './js/components/common/autocomplete-search-with-list.component';
import { DecktrackerComponent } from './js/components/decktracker/decktracker.component';
import { ConstructedMetaDeckSummaryComponent } from './js/components/decktracker/main/constructed-meta-deck-summary.component';
import { ConstructedMetaDecksComponent } from './js/components/decktracker/main/constructed-meta-decks.component';
import { DeckManaCurveBarComponent } from './js/components/decktracker/main/deck-mana-curve-bar.component';
import { DeckManaCurveComponent } from './js/components/decktracker/main/deck-mana-curve.component';
import { DeckMatchupInfoComponent } from './js/components/decktracker/main/deck-matchup-info.component';
import { DeckWinrateMatrixComponent } from './js/components/decktracker/main/deck-winrate-matrix.component';
import { ConstructedDeckbuilderBreadcrumbsComponent } from './js/components/decktracker/main/deckbuilder/constructed-deckbuilder-breadcrumbs.component';
import { ConstructedDeckbuilderCardsComponent } from './js/components/decktracker/main/deckbuilder/constructed-deckbuilder-cards.component';
import { ConstructedDeckbuilderClassComponent } from './js/components/decktracker/main/deckbuilder/constructed-deckbuilder-class.component';
import { ConstructedDeckbuilderFormatComponent } from './js/components/decktracker/main/deckbuilder/constructed-deckbuilder-format.component';
import { ConstructedDeckbuilderComponent } from './js/components/decktracker/main/deckbuilder/constructed-deckbuilder.component';
import { DecktrackerDeckDetailsComponent } from './js/components/decktracker/main/decktracker-deck-details.component';
import { DecktrackerDeckRecapComponent } from './js/components/decktracker/main/decktracker-deck-recap.component';
import { DecktrackerDeckSummaryComponent } from './js/components/decktracker/main/decktracker-deck-summary.component';
import {
	DecktrackerDeckDragTemplateComponent,
	DecktrackerDecksComponent,
} from './js/components/decktracker/main/decktracker-decks.component';
import { DecktrackerLadderStatsMatchupsComponent } from './js/components/decktracker/main/decktracker-ladder-stats-matchups.component';
import { DecktrackerLadderStatsOverviewComponent } from './js/components/decktracker/main/decktracker-ladder-stats-overview.component';
import { DecktrackerLadderStatsComponent } from './js/components/decktracker/main/decktracker-ladder-stats.component';
import { DecktrackerRatingGraphComponent } from './js/components/decktracker/main/decktracker-rating-graph.component';
import { DecktrackerReplaysRecapComponent } from './js/components/decktracker/main/decktracker-replays-recap.component';
import { DecktrackerStatsForReplaysComponent } from './js/components/decktracker/main/decktracker-stats-for-replays.component';
import { ConstructedFormatFilterDropdownComponent } from './js/components/decktracker/main/filters/constructed-format-filter-dropdown.component';
import { ConstructedMyDecksSearchComponent } from './js/components/decktracker/main/filters/constructed-my-decks-search.component';
import { ConstructedRankFilterDropdownComponent } from './js/components/decktracker/main/filters/constructed-rank-filter-dropdown.component';
import { ConstructedTimeFilterDropdownComponent } from './js/components/decktracker/main/filters/constructed-time-filter-dropdown.component';
import { DecktrackerDeckSortDropdownComponent } from './js/components/decktracker/main/filters/decktracker-deck-sort-dropdown.component';
import { DecktrackerFormatFilterDropdownComponent } from './js/components/decktracker/main/filters/decktracker-format-filter-dropdown.component';
import { DecktrackerRankCategoryDropdownComponent } from './js/components/decktracker/main/filters/decktracker-rank-category-dropdown.component';
import { DecktrackerRankFilterDropdownComponent } from './js/components/decktracker/main/filters/decktracker-rank-filter-dropdown.component';
import { DecktrackerRankGroupDropdownComponent } from './js/components/decktracker/main/filters/decktracker-rank-group-dropdown.component';
import { DecktrackerTimeFilterDropdownComponent } from './js/components/decktracker/main/filters/decktracker-time-filter-dropdown.component';
import { DecktrackerFiltersComponent } from './js/components/decktracker/main/filters/_decktracker-filters.component';
import { MenuSelectionDecktrackerComponent } from './js/components/decktracker/main/menu-selection-decktracker.component';
import { DeckTrackerOverlayOpponentComponent } from './js/components/decktracker/overlay/decktracker-overlay-opponent.component';
import { DeckTrackerOverlayPlayerComponent } from './js/components/decktracker/overlay/decktracker-overlay-player.component';
import { DuelsBucketCardComponent } from './js/components/duels/desktop/deckbuilder/duels-bucket-card.component';
import { DuelsBucketCardsListComponent } from './js/components/duels/desktop/deckbuilder/duels-bucket-cards-list.component';
import { DuelsDeckbuilderBreadcrumbsComponent } from './js/components/duels/desktop/deckbuilder/duels-deckbuilder-breadcrumbs.component';
import { DuelsDeckbuilderCardsComponent } from './js/components/duels/desktop/deckbuilder/duels-deckbuilder-cards.component';
import { DuelsDeckbuilderHeroPowerComponent } from './js/components/duels/desktop/deckbuilder/duels-deckbuilder-hero-power.component';
import { DuelsDeckbuilderHeroComponent } from './js/components/duels/desktop/deckbuilder/duels-deckbuilder-hero.component';
import { DuelsDeckbuilderSignatureTreasureComponent } from './js/components/duels/desktop/deckbuilder/duels-deckbuilder-signature-treasure.component';
import { DuelsDeckbuilderComponent } from './js/components/duels/desktop/deckbuilder/duels-deckbuilder.component';
import { DuelsBucketsComponent } from './js/components/duels/desktop/duels-buckets.component';
import { DuelsDeckStatVignetteComponent } from './js/components/duels/desktop/duels-deck-stat-vignette.component';
import { DuelsDesktopComponent } from './js/components/duels/desktop/duels-desktop.component';
import { DuelsEmptyStateComponent } from './js/components/duels/desktop/duels-empty-state.component';
import { DuelsGroupedTopDecksComponent } from './js/components/duels/desktop/duels-grouped-top-decks.component';
import {
	DuelsGlobalValueComponent,
	DuelsHeroStatVignetteComponent,
} from './js/components/duels/desktop/duels-hero-stat-vignette.component';
import { DuelsHeroStatsComponent } from './js/components/duels/desktop/duels-hero-stats.component';
import { DuelsLeaderboardComponent } from './js/components/duels/desktop/duels-leaderboard.component';
import { DuelsPersonalDeckDetailsComponent } from './js/components/duels/desktop/duels-personal-deck-details.component';
import { DuelsPersonalDecksVignetteComponent } from './js/components/duels/desktop/duels-personal-deck-vignette.component';
import { DuelsPersonalDecksComponent } from './js/components/duels/desktop/duels-personal-decks.component';
import { DuelsRewardComponent } from './js/components/duels/desktop/duels-reward.component';
import { DuelsRunComponent } from './js/components/duels/desktop/duels-run.component';
import { DuelsRunsListComponent } from './js/components/duels/desktop/duels-runs-list.component';
import { DuelsTopDecksComponent } from './js/components/duels/desktop/duels-top-decks.component';
import { DuelsTreasureStatsComponent } from './js/components/duels/desktop/duels-treasure-stat.component';
import { DuelsDeckSortDropdownComponent } from './js/components/duels/desktop/filters/duels-deck-sort-dropdown.component';
import { DuelsDustFilterDropdownComponent } from './js/components/duels/desktop/filters/duels-dust-filter-dropdown.component';
import { DuelsGameModeFilterDropdownComponent } from './js/components/duels/desktop/filters/duels-game-mode-filter-dropdown.component';
import { DuelsHeroFilterDropdownComponent } from './js/components/duels/desktop/filters/duels-hero-filter-dropdown.component';
import { DuelsHeroPowerFilterDropdownComponent } from './js/components/duels/desktop/filters/duels-hero-power-filter-dropdown.component';
import { DuelsHeroSortDropdownComponent } from './js/components/duels/desktop/filters/duels-hero-sort-dropdown.component';
import { DuelsLeaderboardGameModeFilterDropdownComponent } from './js/components/duels/desktop/filters/duels-leaderboard-game-mode-filter-dropdown.component';
import { DuelsMmrFilterDropdownComponent } from './js/components/duels/desktop/filters/duels-mmr-filter-dropdown.component';
import { DuelsPassiveFilterDropdownComponent } from './js/components/duels/desktop/filters/duels-passive-filter-dropdown.component';
import { DuelsSignatureTreasureFilterDropdownComponent } from './js/components/duels/desktop/filters/duels-signature-treasure-filter-dropdown.component';
import { DuelsStatTypeFilterDropdownComponent } from './js/components/duels/desktop/filters/duels-stat-type-filter-dropdown.component';
import { DuelsTimeFilterDropdownComponent } from './js/components/duels/desktop/filters/duels-time-filter-dropdown.component';
import { DuelsTreasurePassiveTypeFilterDropdownComponent } from './js/components/duels/desktop/filters/duels-treasure-passive-type-filter-dropdown.component';
import { DuelsTreasuresSortDropdownComponent } from './js/components/duels/desktop/filters/duels-treasures-sort-dropdown.component';
import { DuelsFiltersComponent } from './js/components/duels/desktop/filters/_duels-filters.component';
import { LootBundleComponent } from './js/components/duels/desktop/loot-bundle.component';
import {
	DuelsClassesRecapComponent,
	DuelsStatCellComponent,
} from './js/components/duels/desktop/secondary/duels-classes-recap.component';
import { DuelsDeckStatsComponent } from './js/components/duels/desktop/secondary/duels-deck-stats.component';
import { DuelsHeroSearchComponent } from './js/components/duels/desktop/secondary/duels-hero-search.component';
import { DuelsHeroTierListComponent } from './js/components/duels/desktop/secondary/duels-hero-tier-list.component';
import { DuelsReplaysRecapForRunComponent } from './js/components/duels/desktop/secondary/duels-replays-recap-for-run.component';
import { DuelsReplaysRecapComponent } from './js/components/duels/desktop/secondary/duels-replays-recap.component';
import { DuelsTierComponent } from './js/components/duels/desktop/secondary/duels-tier.component';
import { DuelsTreasureSearchComponent } from './js/components/duels/desktop/secondary/duels-treasure-search.component';
import { DuelsTreasureTierListComponent } from './js/components/duels/desktop/secondary/duels-treasure-tier-list.component';
import { GameCountersComponent } from './js/components/game-counters/game-counters.component';
import { GenericCountersComponent } from './js/components/game-counters/generic-counter.component';
import { LoadingComponent } from './js/components/loading/loading.component';
import { MainWindowComponent } from './js/components/main-window.component';
import { FtueComponent } from './js/components/main-window/ftue/ftue.component';
import { GlobalHeaderComponent } from './js/components/main-window/global-header.component';
import { NewVersionNotificationComponent } from './js/components/main-window/new-version-notification.component';
import { MenuSelectionComponent } from './js/components/menu-selection.component';
import { MercenariesFullyUpgradedFilterDropdownComponent } from './js/components/mercenaries/desktop/filters/mercenaries-fully-upgraded-filter-dropdown.component';
import { MercenariesHeroLevelFilterDropdownComponent } from './js/components/mercenaries/desktop/filters/mercenaries-level-filter-dropdown.component';
import { MercenariesModeFilterDropdownComponent } from './js/components/mercenaries/desktop/filters/mercenaries-mode-filter-dropdown.component';
import { MercenariesOwnedFilterDropdownComponent } from './js/components/mercenaries/desktop/filters/mercenaries-owned-filter-dropdown.component';
import { MercenariesPveDifficultyFilterDropdownComponent } from './js/components/mercenaries/desktop/filters/mercenaries-pve-difficulty-filter-dropdown.component';
import { MercenariesPvpMmrFilterDropdownComponent } from './js/components/mercenaries/desktop/filters/mercenaries-pvp-mmr-filter-dropdown.component';
import { MercenariesRoleFilterDropdownComponent } from './js/components/mercenaries/desktop/filters/mercenaries-role-filter-dropdown.component';
import { MercenariesStarterFilterDropdownComponent } from './js/components/mercenaries/desktop/filters/mercenaries-starter-filter-dropdown.component';
import { MercenariesFiltersComponent } from './js/components/mercenaries/desktop/filters/_mercenaries-filters.component';
import { MercenariesCompositionStatComponent } from './js/components/mercenaries/desktop/mercenaries-composition-stat.component';
import { MercenariesCompositionsStatsComponent } from './js/components/mercenaries/desktop/mercenaries-compositions-stats.component';
import { MercenariesDesktopComponent } from './js/components/mercenaries/desktop/mercenaries-desktop.component';
import { MercenariesEmptyStateComponent } from './js/components/mercenaries/desktop/mercenaries-empty-state.component';
import { MercenariesMetaHeroDetailsComponent } from './js/components/mercenaries/desktop/mercenaries-meta-hero-details.component';
import { MercenariesMetaHeroStatComponent } from './js/components/mercenaries/desktop/mercenaries-meta-hero-stat.component';
import { MercenariesMetaHeroStatsComponent } from './js/components/mercenaries/desktop/mercenaries-meta-hero-stats.component';
import { MercenariesMyTeamsComponent } from './js/components/mercenaries/desktop/mercenaries-my-teams.component';
import { MercenariesPersonalHeroStatComponent } from './js/components/mercenaries/desktop/mercenaries-personal-hero-stat.component';
import {
	MercenariesPersonalHeroStatsComponent,
	SortableLabelComponent,
} from './js/components/mercenaries/desktop/mercenaries-personal-hero-stats.component';
import { MercenariesPersonalTeamSummaryComponent } from './js/components/mercenaries/desktop/mercenaries-personal-team-summary.component';
import { MercenariesHeroSearchComponent } from './js/components/mercenaries/desktop/secondary/mercenaries-hero-search.component';
import { MercenariesComposiionDetailsComponent } from './js/components/mercenaries/desktop/unused_mercenaries-composition-details.component';
import { MercenariesActionsQueueComponent } from './js/components/mercenaries/overlay/action-queue/mercenaries-action-queue..component';
import { MercenariesActionComponent } from './js/components/mercenaries/overlay/action-queue/mercenaries-action.component';
import { MercenariesHighlightDirective } from './js/components/mercenaries/overlay/teams/mercenaries-highlight.directive';
import { MercenariesOpponentTeamComponent } from './js/components/mercenaries/overlay/teams/mercenaries-opponent-team.component';
import { MercenariesOutOfCombatPlayerTeamComponent } from './js/components/mercenaries/overlay/teams/mercenaries-out-of-combat-player-team.component';
import { MercenariesPlayerTeamComponent } from './js/components/mercenaries/overlay/teams/mercenaries-player-team.component';
import { MercenariesTeamAbilityComponent } from './js/components/mercenaries/overlay/teams/mercenaries-team-ability.component';
import { MercenariesTeamControlBarComponent } from './js/components/mercenaries/overlay/teams/mercenaries-team-control-bar.component';
import { MercenariesTeamListComponent } from './js/components/mercenaries/overlay/teams/mercenaries-team-list.component';
import { MercenariesTeamMercenaryComponent } from './js/components/mercenaries/overlay/teams/mercenaries-team-mercenary.component';
import {
	MercenariesTeamRootComponent,
	MercsTasksListComponent,
} from './js/components/mercenaries/overlay/teams/mercenaries-team-root..component';
import { MercenariesOutOfCombatTreasureSelectionComponent } from './js/components/mercenaries/overlay/treasure-selection/mercenaries-out-of-combat-treasure-selection.component';
import { NotificationsComponent } from './js/components/notifications.component';
import { BgsBannedTribesWidgetWrapperComponent } from './js/components/overlays/bgs-banned-tribes-widget-wrapper.component';
import { BgsBattleSimulationWidgetWrapperComponent } from './js/components/overlays/bgs-battle-simulation-widget-wrapper.component';
import { BgsBoardWidgetWrapperComponent } from './js/components/overlays/bgs-board-widget-wrapper.component';
import { BgsHeroSelectionWidgetWrapperComponent } from './js/components/overlays/bgs-hero-selection-widget-wrapper.component';
import { BgsLeaderboardWidgetWrapperComponent } from './js/components/overlays/bgs-leaderboard-widget-wrapper.component';
import { BgsMinionsTiersWidgetWrapperComponent } from './js/components/overlays/bgs-minion-tiers-widget-wrapper.component';
import { BgsQuestsWidgetWrapperComponent } from './js/components/overlays/bgs-quests-widget-wrapper.component';
import { BgsWindowButtonWidgetWrapperComponent } from './js/components/overlays/bgs-window-button-widget-wrapper.component';
import { HeroPowerOverlayComponent } from './js/components/overlays/board/hero-power-overlay.component';
import { MinionOnBoardOverlayComponent } from './js/components/overlays/board/minion-on-board-overlay.component';
import {
	ChoosingCardOptionComponent,
	ChoosingCardWidgetWrapperComponent,
} from './js/components/overlays/card-choice/choosing-card-widget-wrapper.component';
import { ConstructedBoardWidgetWrapperComponent } from './js/components/overlays/constructed-board-widget-wrapper.component';
import { AbstractCounterWidgetWrapperComponent } from './js/components/overlays/counters/abstract-counter-widget-wrapper.component';
import { OpponentAbyssalCurseWidgetWrapperComponent } from './js/components/overlays/counters/opponent-abyssal-curse-widget-wrapper.component';
import { OpponentCounterWidgetWrapperComponent } from './js/components/overlays/counters/opponent-attack-widget-wrapper.component';
import { OpponentCthunWidgetWrapperComponent } from './js/components/overlays/counters/opponent-cthun-widget-wrapper.component';
import { OpponentElwynnBoarWidgetWrapperComponent } from './js/components/overlays/counters/opponent-elwynn-boar-widget-wrapper.component';
import { OpponentFatigueWidgetWrapperComponent } from './js/components/overlays/counters/opponent-fatigue-widget-wrapper.component';
import { OpponentGalakrondWidgetWrapperComponent } from './js/components/overlays/counters/opponent-galakrond-widget-wrapper.component';
import { OpponentHeroPowerDamageWidgetWrapperComponent } from './js/components/overlays/counters/opponent-hero-power-damage-widget-wrapper.component';
import { OpponentJadeWidgetWrapperComponent } from './js/components/overlays/counters/opponent-jade-widget-wrapper.component';
import { OpponentLibramWidgetWrapperComponent } from './js/components/overlays/counters/opponent-libram-widget-wrapper.component';
import { OpponentPogoWidgetWrapperComponent } from './js/components/overlays/counters/opponent-pogo-widget-wrapper.component';
import { OpponentRelicWidgetWrapperComponent } from './js/components/overlays/counters/opponent-relic-widget-wrapper.component';
import { OpponentVolatileSkeletonWidgetWrapperComponent } from './js/components/overlays/counters/opponent-volatile-skeleton-widget-wrapper.component';
import { OpponentWatchpostCounterWidgetWrapperComponent } from './js/components/overlays/counters/opponent-watchpost-widget-wrapper.component';
import { PlayerAbyssalCurseWidgetWrapperComponent } from './js/components/overlays/counters/player-abyssal-curse-widget-wrapper.component';
import { PlayerCounterWidgetWrapperComponent } from './js/components/overlays/counters/player-attack-widget-wrapper.component';
import { PlayerBgsMajordomoWidgetWrapperComponent } from './js/components/overlays/counters/player-bgs-majordomo-widget-wrapper.component';
import { PlayerBgsSouthseaWidgetWrapperComponent } from './js/components/overlays/counters/player-bgs-southsea-widget-wrapper.component';
import { PlayerBolnerWidgetWrapperComponent } from './js/components/overlays/counters/player-bolner-widget-wrapper.component';
import { PlayerBrilliantMacawWidgetWrapperComponent } from './js/components/overlays/counters/player-brilliant-macaw-widget-wrapper.component';
import { PlayerCoralKeeperWidgetWrapperComponent } from './js/components/overlays/counters/player-coral-keeper-widget-wrapper.component';
import { PlayerCthunWidgetWrapperComponent } from './js/components/overlays/counters/player-cthun-widget-wrapper.component';
import { PlayerElementalWidgetWrapperComponent } from './js/components/overlays/counters/player-elemental-widget-wrapper.component';
import { PlayerElwynnBoarWidgetWrapperComponent } from './js/components/overlays/counters/player-elwynn-boar-widget-wrapper.component';
import { PlayerFatigueWidgetWrapperComponent } from './js/components/overlays/counters/player-fatigue-widget-wrapper.component';
import { PlayerGalakrondWidgetWrapperComponent } from './js/components/overlays/counters/player-galakrond-widget-wrapper.component';
import { PlayerGreySageParrotWidgetWrapperComponent } from './js/components/overlays/counters/player-grey-sage-parrot-widget-wrapper.component';
import { PlayerHeroPowerDamageWidgetWrapperComponent } from './js/components/overlays/counters/player-hero-power-damage-widget-wrapper.component';
import { PlayerJadeWidgetWrapperComponent } from './js/components/overlays/counters/player-jade-widget-wrapper.component';
import { PlayerLadyDarkveinWidgetWrapperComponent } from './js/components/overlays/counters/player-lady-darkvein-widget-wrapper.component';
import { PlayerLibramWidgetWrapperComponent } from './js/components/overlays/counters/player-libram-widget-wrapper.component';
import { PlayerMonstrousParrotWidgetWrapperComponent } from './js/components/overlays/counters/player-monstrous-parrot-widget-wrapper.component';
import { PlayerMulticasterWidgetWrapperComponent } from './js/components/overlays/counters/player-multicaster-widget-wrapper.component';
import { PlayerMurozondTheInfiniteWidgetWrapperComponent } from './js/components/overlays/counters/player-murozond-widget-wrapper.component';
import { PlayerPogoWidgetWrapperComponent } from './js/components/overlays/counters/player-pogo-widget-wrapper.component';
import { PlayerQueensguardWidgetWrapperComponent } from './js/components/overlays/counters/player-queensguard-widget-wrapper.component';
import { PlayerRelicWidgetWrapperComponent } from './js/components/overlays/counters/player-relic-widget-wrapper.component';
import { PlayerSpectralPillagerWidgetWrapperComponent } from './js/components/overlays/counters/player-spectral-pillager-widget-wrapper.component';
import { PlayerSpellWidgetWrapperComponent } from './js/components/overlays/counters/player-spell-widget-wrapper.component';
import { PlayerVanessaVanCleefWidgetWrapperComponent } from './js/components/overlays/counters/player-vanessa-widget-wrapper.component';
import { PlayerVolatileSkeletonWidgetWrapperComponent } from './js/components/overlays/counters/player-volatile-skeleton-widget-wrapper.component';
import { PlayerWatchpostCounterWidgetWrapperComponent } from './js/components/overlays/counters/player-watchpost-widget-wrapper.component';
import { CurrentSessionWidgetWrapperComponent } from './js/components/overlays/current-session-widget-wrapper.component';
import { DecktrackerOpponentWidgetWrapperComponent } from './js/components/overlays/decktracker-opponent-widget-wrapper.component';
import { DecktrackerPlayerWidgetWrapperComponent } from './js/components/overlays/decktracker-player-widget-wrapper.component';
import { DuelsDecktrackerOocWidgetWrapperComponent } from './js/components/overlays/duels-decktracker-ooc-widget-wrapper.component';
import { DuelsMaxLifeOpponentWidgetWrapperComponent } from './js/components/overlays/duels-max-life-player-widget-wrapper.component';
import { DuelsMaxLifeWidgetComponent } from './js/components/overlays/duels-max-life/duels-max-life-widget.component';
import { DuelsOocDeckSelectWidgetWrapperComponent } from './js/components/overlays/duels-ooc-deck-select-widget-wrapper.component';
import { DuelsOutOfCombatHeroPowerSelectionWidgetWrapperComponent } from './js/components/overlays/duels-ooc-hero-power-selection-widget-wrapper.component';
import { DuelsOutOfCombatHeroSelectionWidgetWrapperComponent } from './js/components/overlays/duels-ooc-hero-selection-widget-wrapper.component';
import { DuelsOutOfCombatSignatureTreasureSelectionWidgetWrapperComponent } from './js/components/overlays/duels-ooc-signature-treasure-widget-wrapper.component';
import { DuelsOutOfCombatTreasureSelectionWidgetWrapperComponent } from './js/components/overlays/duels-ooc-treasure-selection-widget-wrapper.component';
import { DuelsDeckWidgetComponent } from './js/components/overlays/duels-ooc/duels-deck-widget.component';
import { DuelsDecktrackerOocComponent } from './js/components/overlays/duels-ooc/duels-decktracker-ooc.component';
import { DuelsHeroInfoComponent } from './js/components/overlays/duels-ooc/duels-hero-info.component';
import { DuelsHeroPowerInfoComponent } from './js/components/overlays/duels-ooc/duels-hero-power-info.component';
import { DuelsOutOfCombatDeckSelectComponent } from './js/components/overlays/duels-ooc/duels-ooc-deck-select.component';
import { DuelsOutOfCombatHeroPowerSelectionComponent } from './js/components/overlays/duels-ooc/duels-ooc-hero-power-selection.component';
import { DuelsOutOfCombatHeroSelectionComponent } from './js/components/overlays/duels-ooc/duels-ooc-hero-selection.component';
import { DuelsOutOfCombatSignatureTreasureSelectionComponent } from './js/components/overlays/duels-ooc/duels-ooc-signature-treasure-selection.component';
import { DuelsOutOfCombatTreasureSelectionComponent } from './js/components/overlays/duels-ooc/duels-ooc-treasure-selection.component';
import { DuelsSignatureTreasureInfoComponent } from './js/components/overlays/duels-ooc/duels-signature-treasure-info.component';
import { HsQuestsWidgetWrapperComponent } from './js/components/overlays/hs-quests-widget-wrapper.component';
import { MercsActionQueueWidgetWrapperComponent } from './js/components/overlays/mercs-action-queue-widget-wrapper.component';
import { MercsOpponentTeamWidgetWrapperComponent } from './js/components/overlays/mercs-opponent-team-widget-wrapper.component';
import { MercsOutOfCombatPlayerTeamWidgetWrapperComponent } from './js/components/overlays/mercs-out-of-combat-player-team-widget-wrapper.component';
import { MercsPlayerTeamWidgetWrapperComponent } from './js/components/overlays/mercs-player-team-widget-wrapper.component';
import { MercsQuestsWidgetWrapperComponent } from './js/components/overlays/mercs-quests-widget-wrapper.component';
import { MercsTreasureSelectionWidgetWrapperComponent } from './js/components/overlays/mercs-treasure-selection-widget-wrapper.component';
import { OpponentHandWidgetWrapperComponent } from './js/components/overlays/opponent-hand-widget-wrapper.component';
import { OpponentCardInfoIdComponent } from './js/components/overlays/opponenthand/opponent-card-info-id.component';
import { OpponentCardInfoComponent } from './js/components/overlays/opponenthand/opponent-card-info.component';
import { OpponentCardInfosComponent } from './js/components/overlays/opponenthand/opponent-card-infos.component';
import { OpponentCardTurnNumberComponent } from './js/components/overlays/opponenthand/opponent-card-turn-number.component';
import { OpponentHandOverlayComponent } from './js/components/overlays/opponenthand/opponent-hand-overlay.component';
import { PlayerHeroPowerWidgetWrapperComponent } from './js/components/overlays/player-hero-power-widget-wrapper.component';
import { BgsQuestsWidgetComponent } from './js/components/overlays/quests/bgs-quests-widget.component';
import { HsQuestsWidgetComponent } from './js/components/overlays/quests/hs-quests-widget.component';
import { MercsQuestsWidgetComponent } from './js/components/overlays/quests/mercs-quests-widget.component';
import {
	HsQuestsListWidgetComponent,
	QuestsWidgetViewComponent,
} from './js/components/overlays/quests/quests-widget-view.component';
import { SecretsHelperWidgetWrapperComponent } from './js/components/overlays/secrets-helper-widget-wrapper.component';
import { CurrentSessionBgsBoardTooltipComponent } from './js/components/overlays/session/current-session-bgs-board-tooltip.component';
import { CurrentSessionWidgetComponent } from './js/components/overlays/session/current-session-widget.component';
import { TurnTimerWidgetWrapperComponent } from './js/components/overlays/turn-timer-widget-wrapper.component';
import {
	TurnTimerPlayerComponent,
	TurnTimerWidgetComponent,
} from './js/components/overlays/turntimer/turn-timer-widget.component';
import { FullScreenOverlaysClickthroughComponent } from './js/components/overlays/_full-screen-overlays-clickthrough.component';
import { FullScreenOverlaysComponent } from './js/components/overlays/_full-screen-overlays.component';
import { RegionFilterDropdownComponent } from './js/components/replays/filters/region-filter-dropdown.component';
import { ReplaysBgHeroFilterDropdownComponent } from './js/components/replays/filters/replays-bg-hero-filter-dropdown.component';
import { ReplaysDeckstringFilterDropdownComponent } from './js/components/replays/filters/replays-deckstring-filter-dropdown.component';
import { ReplaysGameModeFilterDropdownComponent } from './js/components/replays/filters/replays-game-mode-filter-dropdown.component';
import { ReplaysOpponentClassFilterDropdownComponent } from './js/components/replays/filters/replays-opponent-class-filter-dropdown.component';
import { ReplaysPlayerClassFilterDropdownComponent } from './js/components/replays/filters/replays-player-class-filter-dropdown.component';
import { GameReplayComponent } from './js/components/replays/game-replay.component';
import { GroupedReplaysComponent } from './js/components/replays/grouped-replays.component';
import { MatchDetailsComponent } from './js/components/replays/match-details.component';
import { RankImageComponent } from './js/components/replays/rank-image.component';
import { ReplayInfoBattlegroundsComponent } from './js/components/replays/replay-info/replay-info-battlegrounds.component';
import { ReplayInfoDuelsComponent } from './js/components/replays/replay-info/replay-info-duels.component';
import { ReplayInfoGenericComponent } from './js/components/replays/replay-info/replay-info-generic.component';
import {
	ReplayInfoMercenariesComponent,
	ReplayInfoMercPlayerComponent,
} from './js/components/replays/replay-info/replay-info-mercenaries.component';
import { ReplayInfoRankedComponent } from './js/components/replays/replay-info/replay-info-ranked.component';
import { ReplayInfoComponent } from './js/components/replays/replay-info/_replay-info.component';
import { ReplayIconToggleComponent } from './js/components/replays/replays-icon-toggle.component';
import { ReplaysListViewComponent } from './js/components/replays/replays-list-view.component';
import { ReplaysListComponent } from './js/components/replays/replays-list.component';
import { ReplayMercDetailsToggleComponent } from './js/components/replays/replays-merc-details-toggle.component';
import { ReplaysComponent } from './js/components/replays/replays.component';
import { SecretsHelperControlBarComponent } from './js/components/secrets-helper/secrets-helper-control-bar.component';
import { SecretsHelperWidgetIconComponent } from './js/components/secrets-helper/secrets-helper-widget-icon.component';
import { SecretsHelperComponent } from './js/components/secrets-helper/secrets-helper.component';
import { SettingsAchievementsMenuComponent } from './js/components/settings/achievements/settings-achievements-menu.component';
import { SettingsAchievementsNotificationsComponent } from './js/components/settings/achievements/settings-achievements-notifications.component';
import { SettingsAchievementsComponent } from './js/components/settings/achievements/settings-achievements.component';
import { SettingsAchievementsLiveComponent } from './js/components/settings/achievements/unused_settings-achievements-live.component';
import { AdvancedSettingDirective } from './js/components/settings/advanced-setting.directive';
import { SettingsBattlegroundsGeneralComponent } from './js/components/settings/battlegrounds/settings-battlegrounds-general.component';
import { SettingsBattlegroundsMenuComponent } from './js/components/settings/battlegrounds/settings-battlegrounds-menu.component';
import { SettingsBattlegroundsOverlayComponent } from './js/components/settings/battlegrounds/settings-battlegrounds-overlay.component';
import { SettingsBattlegroundsSessionComponent } from './js/components/settings/battlegrounds/settings-battlegrounds-session.component';
import { SettingsBattlegroundsComponent } from './js/components/settings/battlegrounds/settings-battlegrounds.component';
import { SettingsCollectionMenuComponent } from './js/components/settings/collection/settings-collection-menu.component';
import { SettingsCollectionNotificationComponent } from './js/components/settings/collection/settings-collection-notification';
import { SettingsCollectionComponent } from './js/components/settings/collection/settings-collection.component';
import { SettingsBroadcastComponent } from './js/components/settings/decktracker/settings-broadcast';
import { SettingsDecktrackerBetaComponent } from './js/components/settings/decktracker/settings-decktracker-beta.component';
import { SettingsDecktrackerDuelsComponent } from './js/components/settings/decktracker/settings-decktracker-duels.component';
import { SettingsDecktrackerGlobalComponent } from './js/components/settings/decktracker/settings-decktracker-global';
import { SettingsDecktrackerLaunchComponent } from './js/components/settings/decktracker/settings-decktracker-launch';
import { SettingsDecktrackerMenuComponent } from './js/components/settings/decktracker/settings-decktracker-menu.component';
import { SettingsDecktrackerOpponentDeckComponent } from './js/components/settings/decktracker/settings-decktracker-opponent-deck';
import { SettingsDecktrackerTurnTimerComponent } from './js/components/settings/decktracker/settings-decktracker-turn-timer.component';
import { SettingsDecktrackerYourDeckComponent } from './js/components/settings/decktracker/settings-decktracker-your-deck';
import { SettingsDecktrackerComponent } from './js/components/settings/decktracker/settings-decktracker.component';
import { LocalizationDropdownComponent } from './js/components/settings/general/localization-dropdown.component';
import { SettingsGeneralBugReportComponent } from './js/components/settings/general/settings-general-bug-report.component';
import { SettingsGeneralDataComponent } from './js/components/settings/general/settings-general-data.component';
import { SettingsGeneralLaunchComponent } from './js/components/settings/general/settings-general-launch.component';
import { SettingsGeneralLocalizationComponent } from './js/components/settings/general/settings-general-localization.component';
import { SettingsGeneralMenuComponent } from './js/components/settings/general/settings-general-menu.component';
import { SettingsGeneralQuestsComponent } from './js/components/settings/general/settings-general-quests.component';
import { SettingsGeneralThirdPartyComponent } from './js/components/settings/general/settings-general-third-party.component';
import { SettingsGeneralComponent } from './js/components/settings/general/settings-general.component';
import { SettingsMercenariesGeneralComponent } from './js/components/settings/mercenaries/settings-mercenaries-general.component';
import { SettingsMercenariesMenuComponent } from './js/components/settings/mercenaries/settings-mercenaries-menu.component';
import { SettingsMercenariesQuestsComponent } from './js/components/settings/mercenaries/settings-mercenaries-quests.component';
import { SettingsMercenariesComponent } from './js/components/settings/mercenaries/settings-mercenaries.component';
import { ModalVideoSettingsChangedComponent } from './js/components/settings/modal/modal-video-settings-changed.component';
import { SettingsModalComponent } from './js/components/settings/modal/settings-modal.component';
import { PreferenceSliderComponent } from './js/components/settings/preference-slider.component';
import { SettingsReplaysGeneralComponent } from './js/components/settings/replays/settings-replays-general.component';
import { SettingsReplaysMenuComponent } from './js/components/settings/replays/settings-replays-menu.component';
import { SettingsReplaysComponent } from './js/components/settings/replays/settings-replays.component';
import { SettingsAdvancedToggleComponent } from './js/components/settings/settings-advanced-toggle.component';
import { SettingsAppSelectionComponent } from './js/components/settings/settings-app-selection.component';
import { SettingsComponent } from './js/components/settings/settings.component';
import { StatsXpSeasonFilterDropdownComponent } from './js/components/stats/desktop/filters/stats-xp-season-filter-dropdown.component';
import { StatsFiltersComponent } from './js/components/stats/desktop/filters/_stats-filters.component';
import { StatsDesktopComponent } from './js/components/stats/desktop/stats-desktop.component';
import { StatsXpGraphComponent } from './js/components/stats/desktop/stats-xp-graph.component';
import {
	LiveStreamInfoComponent,
	StreamHeroInfosComponent,
} from './js/components/streams/desktop/live-stream-info.component';
import { LiveStreamsComponent } from './js/components/streams/desktop/live-streams.component';
import { StreamsDesktopComponent } from './js/components/streams/desktop/streams-desktop.component';
import { OutOfCardsCallbackComponent } from './js/components/third-party/out-of-cards-callback.component';
import { AutofocusDirective } from './js/directives/autofocus.directive';
import { DaemonComponent } from './libs/boostrap/daemon.component';

import { SingleAdComponent } from '@components/ads/single-ad.component';
import { BattlegroundsMetaStatsHeroesComponent } from '@components/battlegrounds/desktop/categories/meta/battlegrounds-meta-stats-heroes.component';
import { BgsStrategiesViewComponent } from '@components/battlegrounds/desktop/strategy/bgs-strategies-view.component';
import { BgsStrategiesComponent } from '@components/battlegrounds/desktop/strategy/bgs-strategies.component';
import { BgsStrategyCurveComponent } from '@components/battlegrounds/desktop/strategy/bgs-strategy-curve.component';
import { BgsHeroStrategyTipsTooltipComponent } from '@components/battlegrounds/hero-selection/bgs-hero-strategy-tips-tooltip.component';
import { BgsBuddiesComponent } from '@components/battlegrounds/in-game/bgs-buddies.component';
import { ControlWebsiteComponent } from '@components/controls/control-website.component';
import { DeckListStaticComponent } from '@components/decktracker/overlay/deck-list-static.component';
import { DkRunesComponent } from '@components/decktracker/overlay/dk-runes.component';
import { BattlegroundsMinionsTiersTwitchOverlayComponent } from '@components/decktracker/overlay/twitch/battlegrounds-minions-tiers-twitch.component';
import { BgsSimulationOverlayStandaloneComponent } from '@components/decktracker/overlay/twitch/bgs-simulation-overlay-standalone.component';
import { DeckTrackerOverlayContainerComponent } from '@components/decktracker/overlay/twitch/decktracker-overlay-container.component.ts';
import { DeckTrackerOverlayStandaloneComponent } from '@components/decktracker/overlay/twitch/decktracker-overlay-standalone.component';
import { DeckTrackerTwitchTitleBarComponent } from '@components/decktracker/overlay/twitch/decktracker-twitch-title-bar.component';
import { EmptyCardComponent } from '@components/decktracker/overlay/twitch/empty-card.component';
import { LocalizationStandaloneService } from '@components/decktracker/overlay/twitch/localization-standalone.service';
import { StateMouseOverComponent } from '@components/decktracker/overlay/twitch/state-mouse-over.component';
import { TwitchConfigWidgetComponent } from '@components/decktracker/overlay/twitch/twitch-config-widget.component';
import { TwitchPreferencesService } from '@components/decktracker/overlay/twitch/twitch-preferences.service';
import { OpponentAnachronosWidgetWrapperComponent } from '@components/overlays/counters/opponent-anachronos-widget-wrapper.component';
import { OpponentBonelordFrostwhisperWidgetWrapperComponent } from '@components/overlays/counters/opponent-bonelord-frostwhisper-widget-wrapper.component';
import { OpponentShockspitterWidgetWrapperComponent } from '@components/overlays/counters/opponent-shockspitter-widget-wrapper.component';
import { PlayerAnachronosWidgetWrapperComponent } from '@components/overlays/counters/player-anachronos-widget-wrapper.component';
import { PlayerAsvedonWidgetWrapperComponent } from '@components/overlays/counters/player-asvedon-widget-wrapper.component';
import { PlayerBgsMagmalocWidgetWrapperComponent } from '@components/overlays/counters/player-bgs-magmaloc-widget-wrapper.component';
import { PlayerBonelordFrostwhisperWidgetWrapperComponent } from '@components/overlays/counters/player-bonelord-frostwhisper-widget-wrapper.component';
import { PlayerOverdraftWidgetWrapperComponent } from '@components/overlays/counters/player-overdraft-widget-wrapper.component';
import { PlayerShockspitterWidgetWrapperComponent } from '@components/overlays/counters/player-shockspitter-widget-wrapper.component';
import { BgsHeroTipsWidgetWrapperComponent } from '@components/overlays/tips/bgs-hero-tips-widget-wrapper.component';
import { BgsHeroTipsComponent } from '@components/overlays/tips/bgs-hero-tips.component';
import { SettingsGeneralModsComponent } from '@components/settings/general/settings-general-mods.component';
import { PremiumSettingDirective } from '@components/settings/premium-setting.directive';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BattlegroundsDataAccessModule } from '@firestone/battlegrounds/data-access';
import { BattlegroundsViewModule } from '@firestone/battlegrounds/view';
import { DuelsDataAccessModule } from '@firestone/duels/data-access';
import { DuelsViewModule } from '@firestone/duels/view';
import { ReplayColiseumModule } from '@firestone/replay/coliseum';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { Store, translationFileVersion } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { ModsBootstrapService } from '@legacy-import/src/lib/libs/mods/services/mods-bootstrap.service';
import { ModsManagerService } from '@legacy-import/src/lib/libs/mods/services/mods-manager.service';
import { ModsUtilsService } from '@legacy-import/src/lib/libs/mods/services/mods-utils.service';
import { MailboxDesktopComponent } from '@mails/components/mailbox-desktop.component';
import { MailboxMessageComponent } from '@mails/components/mailbox-message/mailbox-message.component';
import { MailboxComponent } from '@mails/components/mailbox/mailbox.component';
import { MailsService } from '@mails/services/mails.service';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { PackDisplayComponent } from '@packs/components/pack-display.component';
import { PackHistoryItemComponent } from '@packs/components/pack-history-item.component';
import { PackHistoryComponent } from '@packs/components/pack-history.component';
import { PackStatTooltipComponent } from '@packs/components/pack-stat-tooltip.component';
import { PackStatComponent } from '@packs/components/pack-stat.component';
import { CollectionPackStatsComponent } from '@packs/components/pack-stats.component';
import { PackMonitor } from '@packs/services/pack-monitor.service';
import { PackStatsService } from '@packs/services/pack-stats.service';
import { TavernBrawlMetaComponent } from '@tavern-brawl/components/meta/tavern-brawl-meta.component';
import { TavernBrawlStatComponent } from '@tavern-brawl/components/stat/tavern-brawl-stat.component';
import { TavernBrawlDesktopComponent } from '@tavern-brawl/components/tavern-brawl-desktop.component';
import { TavernBrawlService } from '@tavern-brawl/services/tavern-brawl.service';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { AdsComponent } from './js/components/ads/ads.component';
import { BgsBattleRecapComponent } from './js/components/battlegrounds/battles/bgs-battle-recap.component';
import { BgsBattleSideComponent } from './js/components/battlegrounds/battles/bgs-battle-side.component';
import { BgsBattleComponent } from './js/components/battlegrounds/battles/bgs-battle.component';
import { BgsBattlesViewComponent } from './js/components/battlegrounds/battles/bgs-battles-view.component';
import { BgsHeroPortraitSimulatorComponent } from './js/components/battlegrounds/battles/bgs-hero-portrait-simulator.component';
import { BgsMinusButtonComponent } from './js/components/battlegrounds/battles/bgs-minus-button.component';
import { BgsPlusButtonComponent } from './js/components/battlegrounds/battles/bgs-plus-button.component';
import { BgsSimulatorKeyboardControls } from './js/components/battlegrounds/battles/simulator-keyboard-controls.service';
import { BgsBoardComponent } from './js/components/battlegrounds/bgs-board.component';
import { BgsCardTooltipComponent } from './js/components/battlegrounds/bgs-card-tooltip.component';
import { BgsPlayerCapsuleComponent } from './js/components/battlegrounds/bgs-player-capsule.component';
import { GraphWithComparisonNewComponent } from './js/components/battlegrounds/graph-with-comparison-new.component';
import { BgsHeroMiniComponent } from './js/components/battlegrounds/hero-selection/bgs-hero-mini.component';
import { BgsHeroOverviewComponent } from './js/components/battlegrounds/hero-selection/bgs-hero-overview.component';
import { BgsHeroSelectionTooltipComponent } from './js/components/battlegrounds/hero-selection/bgs-hero-selection-tooltip.component';
import { BgsHeroStatsComponent } from './js/components/battlegrounds/hero-selection/bgs-hero-stats.component';
import { BgsHeroTierComponent } from './js/components/battlegrounds/hero-selection/bgs-hero-tier.component.ts';
import { BgsHeroTribesComponent } from './js/components/battlegrounds/hero-selection/bgs-hero-tribes.component';
import { BgsBattleStatusComponent } from './js/components/battlegrounds/in-game/bgs-battle-status.component';
import { BgsHeroFaceOffComponent } from './js/components/battlegrounds/in-game/bgs-hero-face-off.component';
import { BgsHeroFaceOffsComponent } from './js/components/battlegrounds/in-game/bgs-hero-face-offs.component';
import { BgsNextOpponentOverviewComponent } from './js/components/battlegrounds/in-game/bgs-next-opponent-overview.component';
import { BgsOpponentOverviewBigComponent } from './js/components/battlegrounds/in-game/bgs-opponent-overview-big.component';
import { BgsOpponentOverviewComponent } from './js/components/battlegrounds/in-game/bgs-opponent-overview.component';
import { BgsQuestRewardsComponent } from './js/components/battlegrounds/in-game/bgs-quest-rewards.component';
import { BgsTriplesComponent } from './js/components/battlegrounds/in-game/bgs-triples.component';
import { MinionIconComponent } from './js/components/battlegrounds/minion-icon.component';
import { BattlegroundsMinionsTiersViewOverlayComponent } from './js/components/battlegrounds/minions-tiers/battlegrounds-minions-tiers-view.component';
import { BattlegroundsMinionsGroupComponent } from './js/components/battlegrounds/minions-tiers/bgs-minions-group.component';
import { BattlegroundsMinionsListComponent } from './js/components/battlegrounds/minions-tiers/minions-list.component';
import { BgsHeroShortRecapComponent } from './js/components/battlegrounds/overlay/bgs-hero-short-recap.component';
import { BgsLeaderboardEmptyCardComponent } from './js/components/battlegrounds/overlay/bgs-leaderboard-empty-card.component';
import { BgsOverlayHeroOverviewComponent } from './js/components/battlegrounds/overlay/bgs-overlay-hero-overview.component';
import { BgsChartHpComponent } from './js/components/battlegrounds/post-match/bgs-chart-hp.component';
import { BgsChartWarbandCompositionComponent } from './js/components/battlegrounds/post-match/bgs-chart-warband-composition.component';
import { BgsChartWarbandStatsComponent } from './js/components/battlegrounds/post-match/bgs-chart-warband-stats.component';
import { BgsPostMatchStatsRecapComponent } from './js/components/battlegrounds/post-match/bgs-post-match-stats-recap.component';
import { BgsPostMatchStatsTabsComponent } from './js/components/battlegrounds/post-match/bgs-post-match-stats-tabs.component';
import { BgsPostMatchStatsComponent } from './js/components/battlegrounds/post-match/bgs-post-match-stats.component';
import { BgsWinrateChartComponent } from './js/components/battlegrounds/post-match/bgs-winrate-chart.component';
import { StatCellComponent } from './js/components/battlegrounds/post-match/stat-cell.component';
import { CdkOverlayContainer } from './js/components/cdk-overlay-container.component';
import { CardComponent } from './js/components/collection/card.component';
import { BasicBarChartComponent } from './js/components/common/chart/basic-bar-chart.component';
import { ControlBugComponent } from './js/components/controls/control-bug.component';
import { ControlCloseComponent } from './js/components/controls/control-close.component';
import { ControlDiscordComponent } from './js/components/controls/control-discord.component';
import { ControlHelpComponent } from './js/components/controls/control-help.component';
import { ControlMaximizeComponent } from './js/components/controls/control-maximize.component';
import { ControlMinimizeComponent } from './js/components/controls/control-minimize.component';
import { ControlSettingsComponent } from './js/components/controls/control-settings.component';
import { ControlShareComponent } from './js/components/controls/control-share.component';
import { CopyDesckstringComponent } from './js/components/decktracker/copy-deckstring.component';
import { ImportDeckstringComponent } from './js/components/decktracker/import-deckstring.component';
import { DeckCardComponent } from './js/components/decktracker/overlay/deck-card.component';
import { DeckListByZoneComponent } from './js/components/decktracker/overlay/deck-list-by-zone.component';
import { DeckListComponent } from './js/components/decktracker/overlay/deck-list.component';
import { DeckZoneComponent } from './js/components/decktracker/overlay/deck-zone.component';
import { DeckTrackerCardsRecapComponent } from './js/components/decktracker/overlay/decktracker-cards-recap.component';
import { DeckTrackerControlBarComponent } from './js/components/decktracker/overlay/decktracker-control-bar.component';
import { DeckTrackerDeckListComponent } from './js/components/decktracker/overlay/decktracker-deck-list.component';
import { DeckTrackerDeckNameComponent } from './js/components/decktracker/overlay/decktracker-deck-name.component';
import { DeckTrackerOverlayRootComponent } from './js/components/decktracker/overlay/decktracker-overlay-root.component';
import { DeckTrackerTitleBarComponent } from './js/components/decktracker/overlay/decktracker-title-bar';
import { DecktrackerWidgetIconComponent } from './js/components/decktracker/overlay/decktracker-widget-icon';
import { DeckTrackerWinrateRecapComponent } from './js/components/decktracker/overlay/decktracker-winrate-recap.component';
import { GroupedDeckListComponent } from './js/components/decktracker/overlay/grouped-deck-list.component';
import { LeaderboardEmptyCardComponent } from './js/components/decktracker/overlay/twitch/leaderboard-empty-card.component';
import { TwitchBgsHeroOverviewComponent } from './js/components/decktracker/overlay/twitch/twitch-bgs-hero-overview.component';
import { FilterDropdownMultiselectComponent } from './js/components/filter-dropdown-multiselect.component';
import { FilterComponent } from './js/components/filter.component';
import { FsFilterDropdownComponent } from './js/components/fs-filter-dropdown.component';
import { HotkeyComponent } from './js/components/hotkey.component';
import { InfiniteScrollComponent } from './js/components/infinite-scroll.component';
import { LoadingStateComponent } from './js/components/loading-state.component';
import { SecondaryDefaultComponent } from './js/components/main-window/secondary-default.component';
import { PlayerParrotMascotWidgetWrapperComponent } from './js/components/overlays/counters/player-parrot-mascot-widget-wrapper.component';
import { ProgressBarComponent } from './js/components/progress-bar.component';
import { SecretsHelperListComponent } from './js/components/secrets-helper/secrets-helper-list.component';
import { CheckboxComponent } from './js/components/settings/checkbox.component';
import { DropdownComponent } from './js/components/settings/dropdown.component';
import { NumericInputComponent } from './js/components/settings/numeric-input.component';
import { PreferenceDropdownComponent } from './js/components/settings/preference-dropdown.component';
import { PreferenceNumericInputComponent } from './js/components/settings/preference-numeric-input.component';
import { PreferenceToggleComponent } from './js/components/settings/preference-toggle.component';
import { ClipboardShareButtonComponent } from './js/components/sharing/clipboard/clipboard-share-button.component';
import { RedditShareButtonComponent } from './js/components/sharing/reddit/reddit-share-button.component';
import { RedditShareInfoComponent } from './js/components/sharing/reddit/reddit-share-info.component';
import { RedditShareModalComponent } from './js/components/sharing/reddit/reddit-share-modal.component';
import { ShareInfoComponent } from './js/components/sharing/share-info.component';
import { ShareLoginComponent } from './js/components/sharing/share-login.component';
import { SocialShareButtonComponent } from './js/components/sharing/social-share-button.component';
import { SocialShareModalComponent } from './js/components/sharing/social-share-modal.component';
import { SocialSharesComponent } from './js/components/sharing/social-shares.component';
import { TwitterShareButtonComponent } from './js/components/sharing/twitter/twitter-share-button.component';
import { TwitterShareModalComponent } from './js/components/sharing/twitter/twitter-share-modal.component';
import { ConfirmationComponent } from './js/components/tooltip/confirmation.component';
import { VersionComponent } from './js/components/version.component';
import { WindowWrapperComponent } from './js/components/window-wrapper.component';
import { WithLoadingComponent } from './js/components/with-loading.component';
import { ActiveThemeDirective } from './js/directives/active-theme.directive';
import { AskConfirmationDirective } from './js/directives/ask-confirmation.directive';
import { BindCssVariableDirective } from './js/directives/bind-css-variable-directive';
import { CachedComponentTooltipDirective } from './js/directives/cached-component-tooltip.directive';
import { ComponentTooltipDirective } from './js/directives/component-tooltip.directive';
import { DoubleClickDirective } from './js/directives/exclusive-double-click.directive';
import { GrowOnClickDirective } from './js/directives/grow-on-click.directive';
import { NgxCacheIfDirective } from './js/directives/ngx-cache-if.directive';
import { OwTranslateDirective } from './js/directives/ow-translate.directive';
import { OwTranslatePipe } from './js/directives/ow-translate.pipe';
import { PulseDirective } from './js/directives/pulse.directive';
import { RippleOnClickDirective } from './js/directives/ripple-on-click.directive';
import { RotateOnMouseOverDirective } from './js/directives/rotate-on-mouse-over.directive';
import { ScrollableDirective } from './js/directives/scrollable.directive';
import { SafeHtmlPipe } from './js/pipes/safe-html.pipe';
import { AchievementHistoryStorageService } from './js/services/achievement/achievement-history-storage.service';
import { AchievementsManager } from './js/services/achievement/achievements-manager.service';
import { AchievementsMonitor } from './js/services/achievement/achievements-monitor.service';
import { AchievementsNotificationService } from './js/services/achievement/achievements-notification.service';
import { AchievementsRepository } from './js/services/achievement/achievements-repository.service';
import { AchievementsStorageService } from './js/services/achievement/achievements-storage.service';
import { ChallengeBuilderService } from './js/services/achievement/achievements/challenges/challenge-builder.service';
import { AchievementsLoaderService } from './js/services/achievement/data/achievements-loader.service';
import { RemoteAchievementsService } from './js/services/achievement/remote-achievements.service';
import { TemporaryResolutionOverrideService } from './js/services/achievement/temporary-resolution-override-service';
import { AdService } from './js/services/ad.service';
import { setAppInjector } from './js/services/app-injector';
import { ArenaStateBuilderService } from './js/services/arena/arena-state-builder.service';
import { BgsBattlePositioningExecutorService } from './js/services/battlegrounds/bgs-battle-positioning-executor.service';
import { BgsBattlePositioningMockExecutorService } from './js/services/battlegrounds/bgs-battle-positioning-mock-executor.service';
import { BgsBattlePositioningService } from './js/services/battlegrounds/bgs-battle-positioning.service';
import { BgsBattleSimulationExecutorService } from './js/services/battlegrounds/bgs-battle-simulation-executor.service';
import { BgsBattleSimulationMockExecutorService } from './js/services/battlegrounds/bgs-battle-simulation-mock-executor.service';
import { BgsBattleSimulationService } from './js/services/battlegrounds/bgs-battle-simulation.service';
import { BgsBestUserStatsService } from './js/services/battlegrounds/bgs-best-user-stats.service';
import { BgsCustomSimulationService } from './js/services/battlegrounds/bgs-custom-simulation-service.service';
import { BgsGlobalStatsService } from './js/services/battlegrounds/bgs-global-stats.service';
import { BgsInitService } from './js/services/battlegrounds/bgs-init.service';
import { BgsMetaHeroStatsService } from './js/services/battlegrounds/bgs-meta-hero-stats.service';
import { BgsMetaHeroStrategiesService } from './js/services/battlegrounds/bgs-meta-hero-strategies.service';
import { BattlegroundsQuestsService } from './js/services/battlegrounds/bgs-quests.service';
import { BgsRunStatsService } from './js/services/battlegrounds/bgs-run-stats.service';
import { BattlegroundsStoreService } from './js/services/battlegrounds/store/battlegrounds-store.service';
import { RealTimeStatsService } from './js/services/battlegrounds/store/real-time-stats/real-time-stats.service';
import { CardsInitService } from './js/services/cards-init.service';
import { CardHistoryStorageService } from './js/services/collection/card-history-storage.service';
import { CardNotificationsService } from './js/services/collection/card-notifications.service';
import { CardsMonitorService } from './js/services/collection/cards-monitor.service';
import { CollectionManager } from './js/services/collection/collection-manager.service';
import { CollectionStorageService } from './js/services/collection/collection-storage.service';
import { SetsService } from './js/services/collection/sets-service.service';
import { DebugService } from './js/services/debug.service';
import { AiDeckService } from './js/services/decktracker/ai-deck-service.service';
import { ArenaRunParserService } from './js/services/decktracker/arena-run-parser.service';
import { AttackOnBoardService } from './js/services/decktracker/attack-on-board.service';
import { CardsHighlightFacadeService } from './js/services/decktracker/card-highlight/cards-highlight-facade.service';
import { CardsHighlightService } from './js/services/decktracker/card-highlight/cards-highlight.service';
import { ConstructedMetaDecksStateBuilderService } from './js/services/decktracker/constructed-meta-decks-state-builder.service';
import { DeckCardService } from './js/services/decktracker/deck-card.service';
import { DeckHandlerService } from './js/services/decktracker/deck-handler.service';
import { DeckParserService } from './js/services/decktracker/deck-parser.service';
import { DynamicZoneHelperService } from './js/services/decktracker/dynamic-zone-helper.service';
import { DeckManipulationHelper } from './js/services/decktracker/event-parser/deck-manipulation-helper';
import { SecretsParserService } from './js/services/decktracker/event-parser/secrets/secrets-parser.service';
import { GameStateMetaInfoService } from './js/services/decktracker/game-state-meta-info.service';
import { GameStateService } from './js/services/decktracker/game-state.service';
import { DecksProviderService } from './js/services/decktracker/main/decks-provider.service';
import { DecktrackerStateLoaderService } from './js/services/decktracker/main/decktracker-state-loader.service';
import { ReplaysStateBuilderService } from './js/services/decktracker/main/replays-state-builder.service';
import { OverlayDisplayService } from './js/services/decktracker/overlay-display.service';
import { SecretConfigService } from './js/services/decktracker/secret-config.service';
import { ZoneOrderingService } from './js/services/decktracker/zone-ordering.service';
import { DevService } from './js/services/dev.service';
import { DuelsDecksProviderService } from './js/services/duels/duels-decks-provider.service';
import { DuelsLootParserService } from './js/services/duels/duels-loot-parser.service';
import { DuelsMemoryCacheService } from './js/services/duels/duels-memory-cache.service';
import { DuelsRewardsService } from './js/services/duels/duels-rewards.service';
import { DuelsRunIdService } from './js/services/duels/duels-run-id.service';
import { DuelsStateBuilderService } from './js/services/duels/duels-state-builder.service';
import { Events } from './js/services/events.service';
import { GameEventsEmitterService } from './js/services/game-events-emitter.service';
import { GameEvents } from './js/services/game-events.service';
import { GameModeDataService } from './js/services/game-mode-data.service';
import { GameStatusService } from './js/services/game-status.service';
import { GameNativeStateStoreService } from './js/services/game/game-native-state-store.service';
import { GenericStorageService } from './js/services/generic-storage.service';
import { GlobalStatsNotifierService } from './js/services/global-stats/global-stats-notifier.service';
import { GlobalStatsService } from './js/services/global-stats/global-stats.service';
import { HotkeyService } from './js/services/hotkey.service';
import { LazyDataInitService } from './js/services/lazy-data-init.service';
import { LocalizationFacadeService } from './js/services/localization-facade.service';
import { LocalizationService } from './js/services/localization.service';
import { LogListenerService } from './js/services/log-listener.service';
import { LogRegisterService } from './js/services/log-register.service';
import { LogsUploaderService } from './js/services/logs-uploader.service';
import { LiveStreamsService } from './js/services/mainwindow/live-streams.service';
import { OutOfCardsService } from './js/services/mainwindow/out-of-cards.service';
import { CollaboratorsService } from './js/services/mainwindow/store/collaborators.service';
import { CollectionBootstrapService } from './js/services/mainwindow/store/collection-bootstrap.service';
import { AchievementUpdateHelper } from './js/services/mainwindow/store/helper/achievement-update-helper';
import { MainWindowStoreService } from './js/services/mainwindow/store/main-window-store.service';
import { StoreBootstrapService } from './js/services/mainwindow/store/store-bootstrap.service';
import { TwitchAuthService } from './js/services/mainwindow/twitch-auth.service';
import { TwitchPresenceService } from './js/services/mainwindow/twitch-presence.service';
import { EndGameListenerService } from './js/services/manastorm-bridge/end-game-listener.service';
import { EndGameUploaderService } from './js/services/manastorm-bridge/end-game-uploader.service';
import { GameParserService } from './js/services/manastorm-bridge/game-parser.service';
import { ReplayUploadService } from './js/services/manastorm-bridge/replay-upload.service';
import { MercenariesSynergiesHighlightService } from './js/services/mercenaries/highlights/mercenaries-synergies-highlight.service';
import { MercenariesMemoryCacheService } from './js/services/mercenaries/mercenaries-memory-cache.service';
import { MercenariesMemoryUpdateService } from './js/services/mercenaries/mercenaries-memory-updates.service';
import { MercenariesStateBuilderService } from './js/services/mercenaries/mercenaries-state-builder.service';
import { MercenariesStoreService } from './js/services/mercenaries/mercenaries-store.service';
import { MercenariesOutOfCombatService } from './js/services/mercenaries/out-of-combat/mercenaries-out-of-combat.service';
import { OwNotificationsService } from './js/services/notifications.service';
import { PatchesConfigService } from './js/services/patches-config.service';
import { GameEventsPluginService } from './js/services/plugins/game-events-plugin.service';
import { MemoryInspectionService } from './js/services/plugins/memory-inspection.service';
import { MindVisionFacadeService } from './js/services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionStateMachineService } from './js/services/plugins/mind-vision/mind-vision-state-machine.service';
import { OwUtilsService } from './js/services/plugins/ow-utils.service';
import { SimpleIOService } from './js/services/plugins/simple-io.service';
import { PreferencesService } from './js/services/preferences.service';
import { QuestsService } from './js/services/quests.service';
import { RealTimeNotificationService } from './js/services/real-time-notifications.service';
import { ReplaysNotificationService } from './js/services/replays/replays-notification.service';
import { ReviewIdService } from './js/services/review-id.service';
import { RewardMonitorService } from './js/services/rewards/rewards-monitor';
import { S3FileUploadService } from './js/services/s3-file-upload.service';
import { SettingsCommunicationService } from './js/services/settings/settings-communication.service';
import { GameStatsLoaderService } from './js/services/stats/game/game-stats-loader.service';
import { GameStatsProviderService } from './js/services/stats/game/game-stats-provider.service';
import { GameStatsUpdaterService } from './js/services/stats/game/game-stats-updater.service';
import { StatsStateBuilderService } from './js/services/stats/stats-state-builder.service';
import { SystemTrayService } from './js/services/system-tray.service';
import { TipService } from './js/services/tip.service';
import { AppUiStoreFacadeService } from './js/services/ui-store/app-ui-store-facade.service';
import { AppUiStoreService } from './js/services/ui-store/app-ui-store.service';
import { UserService } from './js/services/user.service';
import { AppBootstrapService } from './libs/boostrap/app-bootstrap.service';
import { AppStartupService } from './libs/boostrap/app-startup.service';
import { BootstrapEssentialServicesService } from './libs/boostrap/bootstrap-essential-services.service';
import { BootstrapOtherServicesService } from './libs/boostrap/bootstrap-other-services.service';
import { BootstrapStoreServicesService } from './libs/boostrap/bootstrap-store-services.service';
import { ModsConfigService } from './libs/mods/services/mods-config.service';
console.log('environment is ' + process.env['NODE_ENV'], process.env);

try {
	overwolf?.extensions.current.getManifest((manifestResult) => {
		process.env['APP_VERSION'] = manifestResult.meta.version;
		console.log('version is ' + process.env['APP_VERSION']);

		overwolf.settings.getExtensionSettings((settingsResult) => {
			const sampleRate = settingsResult?.settings?.channel === 'beta' ? 1 : 0.1;
			process.env['APP_CHANNEL'] = settingsResult?.settings?.channel;
			const release = `firestone@${manifestResult.meta.version}`;
			console.log(
				'init Sentry with sampleRate',
				sampleRate,
				release,
				settingsResult?.settings?.channel,
				settingsResult,
			);
			init({
				dsn: 'https://53b0813bb66246ae90c60442d05efefe@o92856.ingest.sentry.io/1338840',
				enabled: process.env['NODE_ENV'] === 'production',
				release: release,
				attachStacktrace: true,
				sampleRate: sampleRate,
				normalizeDepth: 6,
				ignoreErrors: ['ResizeObserver loop limit exceeded'],
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
	});
} catch (e) {
	console.log('could not gt overwolf info, continuing', e);
}

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
	handleError(error: { originalError: unknown }): unknown {
		// console.log('capturing error', error);
		const originalError = error.originalError ?? error;
		captureException(originalError);
		throw error;
	}
}

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
	return new TranslateHttpLoader(
		http,
		'https://static.firestoneapp.com/data/i18n/',
		!!translationFileVersion?.length ? `.json?v=${translationFileVersion}` : undefined,
	);
}

@NgModule({
	imports: [
		// Needed for Twitch
		CommonModule,
		HttpClientModule,
		BrowserAnimationsModule,
		FormsModule,
		ReactiveFormsModule,
		NgScrollbarModule,
		InlineSVGModule.forRoot(),

		OverlayModule,
		SelectModule,
		FormsModule,
		ReactiveFormsModule,

		SharedCommonViewModule,
		ReplayColiseumModule,
		BattlegroundsDataAccessModule,
		BattlegroundsViewModule,
		StatsDataAccessModule,
		DuelsViewModule,
		DuelsDataAccessModule,

		ColiseumComponentsModule,
		NgxChartsModule,
		NgChartsModule,
		TranslateModule.forRoot({
			defaultLanguage: 'enUS',
			loader: {
				provide: TranslateLoader,
				useFactory: HttpLoaderFactory,
				deps: [HttpClient],
			},
		}),
		DragDropModule,

		// For the app
		A11yModule,
		OverlayModule,

		SimpleNotificationsModule.forRoot(),
		VirtualScrollerModule,
	],
	declarations: [
		// Needed for Twitch
		WindowWrapperComponent,
		SecondaryDefaultComponent,

		ControlHelpComponent,
		ControlMinimizeComponent,
		ControlMaximizeComponent,
		ControlCloseComponent,
		ControlSettingsComponent,
		ControlDiscordComponent,
		ControlWebsiteComponent,
		ControlBugComponent,
		ControlShareComponent,

		HotkeyComponent,
		VersionComponent,

		ConfirmationComponent,

		ComponentTooltipDirective,
		CachedComponentTooltipDirective,
		ActiveThemeDirective,
		PulseDirective,
		AskConfirmationDirective,
		BindCssVariableDirective,
		GrowOnClickDirective,
		RippleOnClickDirective,
		ScrollableDirective,
		NgxCacheIfDirective,
		RotateOnMouseOverDirective,
		DoubleClickDirective,
		OwTranslateDirective,

		LoadingStateComponent,
		WithLoadingComponent,

		PreferenceToggleComponent,
		PreferenceNumericInputComponent,
		CheckboxComponent,
		DropdownComponent,
		NumericInputComponent,
		PreferenceDropdownComponent,

		InfiniteScrollComponent,
		FilterComponent,
		SafeHtmlPipe,
		OwTranslatePipe,

		SocialSharesComponent,
		SocialShareModalComponent,
		ShareLoginComponent,
		ShareInfoComponent,
		SocialShareButtonComponent,
		TwitterShareModalComponent,
		TwitterShareButtonComponent,
		RedditShareModalComponent,
		RedditShareButtonComponent,
		RedditShareInfoComponent,
		ClipboardShareButtonComponent,

		DeckCardComponent,
		DeckTrackerDeckListComponent,
		DeckListByZoneComponent,
		GroupedDeckListComponent,
		DeckZoneComponent,
		CopyDesckstringComponent,
		DeckListComponent,
		DeckListStaticComponent,
		DkRunesComponent,

		BgsOpponentOverviewBigComponent,
		BgsBoardComponent,
		BgsCardTooltipComponent,
		BgsBattleStatusComponent,
		BgsTriplesComponent,
		BgsHeroTribesComponent,
		MinionIconComponent,
		BgsHeroTierComponent,
		BgsHeroMiniComponent,
		BgsHeroSelectionTooltipComponent,
		BgsHeroStrategyTipsTooltipComponent,
		BgsHeroStatsComponent,
		BgsPlayerCapsuleComponent,
		BgsPostMatchStatsComponent,
		BgsPostMatchStatsTabsComponent,
		BgsPostMatchStatsRecapComponent,
		BgsChartHpComponent,
		BgsChartWarbandStatsComponent,
		BgsWinrateChartComponent,
		BgsChartWarbandCompositionComponent,
		BgsHeroOverviewComponent,
		BgsOpponentOverviewComponent,
		BgsNextOpponentOverviewComponent,
		BgsHeroFaceOffsComponent,
		BgsHeroFaceOffComponent,
		BgsQuestRewardsComponent,
		BgsStrategyCurveComponent,
		BgsBuddiesComponent,

		BattlegroundsMinionsTiersViewOverlayComponent,
		BattlegroundsMinionsListComponent,
		BattlegroundsMinionsGroupComponent,

		BgsBattlesViewComponent,
		BgsBattleComponent,
		BgsBattleRecapComponent,
		BgsBattleSideComponent,
		BgsPlusButtonComponent,
		BgsMinusButtonComponent,
		BgsHeroPortraitSimulatorComponent,

		BgsLeaderboardEmptyCardComponent,
		BgsOverlayHeroOverviewComponent,

		GraphWithComparisonNewComponent,
		BasicBarChartComponent,
		PieChartComponent,

		FilterDropdownMultiselectComponent,
		FsFilterDropdownComponent,

		StatCellComponent,
		ProgressBarComponent,

		DeckTrackerOverlayRootComponent,
		DeckTrackerDeckNameComponent,
		DeckTrackerControlBarComponent,
		DeckTrackerTitleBarComponent,
		DeckTrackerCardsRecapComponent,
		DecktrackerWidgetIconComponent,
		DeckTrackerWinrateRecapComponent,
		ImportDeckstringComponent,
		SecretsHelperListComponent,

		WindowWrapperComponent,
		SecondaryDefaultComponent,

		ControlHelpComponent,
		ControlMinimizeComponent,
		ControlMaximizeComponent,
		ControlCloseComponent,
		ControlSettingsComponent,
		ControlBugComponent,
		ControlShareComponent,

		HotkeyComponent,
		VersionComponent,

		ConfirmationComponent,

		ComponentTooltipDirective,
		CachedComponentTooltipDirective,
		ActiveThemeDirective,
		PulseDirective,
		AskConfirmationDirective,
		BindCssVariableDirective,
		GrowOnClickDirective,
		RippleOnClickDirective,
		ScrollableDirective,
		NgxCacheIfDirective,
		RotateOnMouseOverDirective,
		DoubleClickDirective,
		OwTranslateDirective,

		LoadingStateComponent,
		WithLoadingComponent,

		PreferenceToggleComponent,
		PreferenceNumericInputComponent,
		CheckboxComponent,
		DropdownComponent,
		NumericInputComponent,
		PreferenceDropdownComponent,

		InfiniteScrollComponent,
		FilterComponent,
		SafeHtmlPipe,
		OwTranslatePipe,

		SocialSharesComponent,
		SocialShareModalComponent,
		ShareLoginComponent,
		ShareInfoComponent,
		SocialShareButtonComponent,
		TwitterShareModalComponent,
		TwitterShareButtonComponent,
		RedditShareModalComponent,
		RedditShareButtonComponent,
		RedditShareInfoComponent,
		ClipboardShareButtonComponent,

		AdsComponent,
		SingleAdComponent,

		DeckCardComponent,
		DeckTrackerDeckListComponent,
		DeckListByZoneComponent,
		GroupedDeckListComponent,
		DeckZoneComponent,
		CopyDesckstringComponent,
		DeckListStaticComponent,

		BgsOpponentOverviewBigComponent,
		BgsBoardComponent,
		BgsCardTooltipComponent,
		BgsBattleStatusComponent,
		BgsTriplesComponent,
		BgsHeroTribesComponent,
		MinionIconComponent,
		BgsHeroTierComponent,
		BgsHeroMiniComponent,
		BgsHeroSelectionTooltipComponent,
		BgsHeroStrategyTipsTooltipComponent,
		BgsHeroStatsComponent,
		BgsPlayerCapsuleComponent,
		BgsPostMatchStatsComponent,
		BgsPostMatchStatsTabsComponent,
		BgsPostMatchStatsRecapComponent,
		BgsChartHpComponent,
		BgsChartWarbandStatsComponent,
		BgsWinrateChartComponent,
		BgsChartWarbandCompositionComponent,
		BgsHeroOverviewComponent,
		BgsOpponentOverviewComponent,
		BgsNextOpponentOverviewComponent,
		BgsHeroFaceOffsComponent,
		BgsHeroFaceOffComponent,
		BgsQuestRewardsComponent,
		BgsStrategyCurveComponent,

		BattlegroundsMinionsTiersViewOverlayComponent,
		BattlegroundsMinionsListComponent,
		BattlegroundsMinionsGroupComponent,

		BgsBattlesViewComponent,
		BgsBattleComponent,
		BgsBattleRecapComponent,
		BgsBattleSideComponent,
		BgsPlusButtonComponent,
		BgsMinusButtonComponent,
		BgsHeroPortraitSimulatorComponent,

		BgsLeaderboardEmptyCardComponent,
		BgsHeroShortRecapComponent,
		BgsOverlayHeroOverviewComponent,

		GraphWithComparisonNewComponent,
		BasicBarChartComponent,
		PieChartComponent,

		FilterDropdownMultiselectComponent,
		FsFilterDropdownComponent,

		StatCellComponent,
		ProgressBarComponent,

		// Only for the app
		DaemonComponent,
		MainWindowComponent,
		LoadingComponent,
		NotificationsComponent,
		BattlegroundsComponent,
		FullScreenOverlaysComponent,
		FullScreenOverlaysClickthroughComponent,
		BattlegroundsMinionsTiersOverlayComponent,
		BattlegroundsOverlayButtonComponent,
		BgsBannedTribesComponent,
		BgsHeroTipsComponent,
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
		PackStatTooltipComponent,
		PackStatComponent,

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
		BattlegroundsMetaStatsHeroesComponent,
		BattlegroundsPersonalStatsQuestsComponent,
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
		BgsStrategiesComponent,
		BgsStrategiesViewComponent,
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

		MailboxDesktopComponent,
		MailboxComponent,
		MailboxMessageComponent,

		TavernBrawlDesktopComponent,
		TavernBrawlMetaComponent,
		TavernBrawlStatComponent,

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
		BgsHeroTipsWidgetWrapperComponent,
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
		PlayerOverdraftWidgetWrapperComponent,
		PlayerAsvedonWidgetWrapperComponent,
		PlayerMurozondTheInfiniteWidgetWrapperComponent,
		PlayerAnachronosWidgetWrapperComponent,
		PlayerBonelordFrostwhisperWidgetWrapperComponent,
		PlayerShockspitterWidgetWrapperComponent,
		PlayerParrotMascotWidgetWrapperComponent,
		PlayerQueensguardWidgetWrapperComponent,
		PlayerSpectralPillagerWidgetWrapperComponent,
		PlayerLadyDarkveinWidgetWrapperComponent,
		PlayerGreySageParrotWidgetWrapperComponent,
		PlayerMulticasterWidgetWrapperComponent,
		PlayerCoralKeeperWidgetWrapperComponent,
		PlayerBgsSouthseaWidgetWrapperComponent,
		PlayerBgsMagmalocWidgetWrapperComponent,
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
		OpponentAnachronosWidgetWrapperComponent,
		OpponentBonelordFrostwhisperWidgetWrapperComponent,
		OpponentShockspitterWidgetWrapperComponent,

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
		SettingsGeneralModsComponent,

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
		PremiumSettingDirective,
		MercenariesHighlightDirective,
		AutofocusDirective,

		// Twitch
		LeaderboardEmptyCardComponent,
		TwitchBgsHeroOverviewComponent,
		BattlegroundsMinionsTiersTwitchOverlayComponent,
		BgsSimulationOverlayStandaloneComponent,
		DeckTrackerOverlayContainerComponent,
		DeckTrackerOverlayStandaloneComponent,
		DeckTrackerTwitchTitleBarComponent,
		EmptyCardComponent,
		LeaderboardEmptyCardComponent,
		StateMouseOverComponent,
		TwitchBgsHeroOverviewComponent,
		TwitchConfigWidgetComponent,
	],
	providers: [
		{ provide: OverlayContainer, useClass: CdkOverlayContainer },
		{ provide: BgsBattleSimulationExecutorService, useClass: BgsBattleSimulationMockExecutorService },
		{ provide: BgsBattlePositioningExecutorService, useClass: BgsBattlePositioningMockExecutorService },

		SetsService,
		DebugService,
		Events,
		GenericStorageService,
		LogsUploaderService,
		MemoryInspectionService,
		// OverwolfService,
		OwNotificationsService,
		PreferencesService,
		S3FileUploadService,
		SimpleIOService,

		ModsBootstrapService,
		ModsManagerService,
		ModsUtilsService,
		ModsConfigService,

		AchievementHistoryStorageService,
		AchievementsRepository,
		ChallengeBuilderService,
		AchievementsLoaderService,
		AchievementsStorageService,

		DeckHandlerService,
		CardHistoryStorageService,
		CollectionManager,
		CollectionStorageService,
		MindVisionFacadeService,
		MindVisionStateMachineService,
		OwUtilsService,
		HotkeyService,
		CardsHighlightService,
		CardsHighlightFacadeService,

		{ provide: ErrorHandler, useClass: SentryErrorHandler },
		AppBootstrapService,
		BootstrapEssentialServicesService,
		BootstrapStoreServicesService,
		BootstrapOtherServicesService,
		AppStartupService,

		RealTimeNotificationService,
		AdService,
		TipService,
		MainWindowStoreService,
		StoreBootstrapService,
		CollaboratorsService,
		UserService,
		LazyDataInitService,
		GameStatusService,
		QuestsService,
		LiveStreamsService,
		SystemTrayService,

		AppUiStoreService,
		// Not sure that this is needed, but I don't want to replace all instances of the facade by the interface
		{ provide: Store, useClass: AppUiStoreFacadeService },
		AppUiStoreFacadeService,
		{ provide: ILocalizationService, useClass: LocalizationFacadeService },
		LocalizationFacadeService,

		LocalizationService,
		CardsInitService,
		// CardsFacadeService,
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
		BgsMetaHeroStatsService,
		BgsMetaHeroStrategiesService,
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

		TavernBrawlService,
		MailsService,

		// Twitch
		LocalizationStandaloneService,
		TwitchPreferencesService,
	],
	entryComponents: [
		ConfirmationComponent,
		BgsHeroSelectionTooltipComponent,
		BgsHeroStrategyTipsTooltipComponent,
		TwitterShareModalComponent,
		RedditShareModalComponent,
		BgsOverlayHeroOverviewComponent,
	],
	exports: [
		DaemonComponent,
		MainWindowComponent,
		LoadingComponent,
		NotificationsComponent,
		SettingsComponent,
		BattlegroundsComponent,
		OutOfCardsCallbackComponent,
		FullScreenOverlaysComponent,
		FullScreenOverlaysClickthroughComponent,

		DeckTrackerOverlayContainerComponent,
	],
})
export class LegacyFeatureShellModule {
	constructor(private readonly injector: Injector) {
		setAppInjector(injector);
	}
}
