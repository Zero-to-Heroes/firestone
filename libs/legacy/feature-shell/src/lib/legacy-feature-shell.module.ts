import { A11yModule } from '@angular/cdk/a11y';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayContainer, OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Injector, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PieChartComponent } from '@components/common/chart/pie-chart.component';
import { ColiseumComponentsModule } from '@firestone-hs/coliseum-components';
import { AllCardsService as RefCards } from '@firestone-hs/reference-data';
import { NgxChartsModule } from '@sebastientromp/ngx-charts';
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
import { ArenaRunsListComponent } from './js/components/arena/desktop/arena-runs-list.component';
import { ArenaFiltersComponent } from './js/components/arena/desktop/filters/_arena-filters.component';
import { ArenaClassFilterDropdownComponent } from './js/components/arena/desktop/filters/arena-class-filter-dropdown.component';
import { ArenaTimeFilterDropdownComponent } from './js/components/arena/desktop/filters/arena-time-filter-dropdown.component';
import { BattlegroundsContentComponent } from './js/components/battlegrounds/battlegrounds-content.component';
import { BattlegroundsComponent } from './js/components/battlegrounds/battlegrounds.component';
import { BgsBattlesComponent } from './js/components/battlegrounds/battles/bgs-battles.component';
import { BgsBannedTribeComponent } from './js/components/battlegrounds/bgs-banned-tribe.component';
import { BgsBannedTribesComponent } from './js/components/battlegrounds/bgs-banned-tribes.component';
import { BattlegroundsCategoryDetailsComponent } from './js/components/battlegrounds/desktop/battlegrounds-category-details.component';
import { BattlegroundsDesktopComponent } from './js/components/battlegrounds/desktop/battlegrounds-desktop.component';
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
import { BattlegroundsFiltersComponent } from './js/components/battlegrounds/desktop/filters/_battlegrounds-filters.component';
import { BattlegroundsHeroFilterDropdownComponent } from './js/components/battlegrounds/desktop/filters/battlegrounds-hero-filter-dropdown.component';
import { BattlegroundsHeroSortDropdownComponent } from './js/components/battlegrounds/desktop/filters/battlegrounds-hero-sort-dropdown.component';
import { BattlegroundsRankFilterDropdownComponent } from './js/components/battlegrounds/desktop/filters/battlegrounds-rank-filter-dropdown.component';
import { BattlegroundsRankGroupDropdownComponent } from './js/components/battlegrounds/desktop/filters/battlegrounds-rank-group-dropdown.component';
import { BattlegroundsTimeFilterDropdownComponent } from './js/components/battlegrounds/desktop/filters/battlegrounds-time-filter-dropdown.component';
import { BattlegroundsTribesFilterDropdownComponent } from './js/components/battlegrounds/desktop/filters/battlegrounds-tribes-filter-dropdown.component';
import { BattlegroundsHeroRecordsBrokenComponent } from './js/components/battlegrounds/desktop/secondary/battlegrounds-hero-records-broken.component';
import { BattlegroundsHeroesRecordsBrokenComponent } from './js/components/battlegrounds/desktop/secondary/battlegrounds-heroes-records-broken.component';
import { BattlegroundsReplaysRecapComponent } from './js/components/battlegrounds/desktop/secondary/battlegrounds-replays-recap.component';
import { BattlegroundsTierListComponent } from './js/components/battlegrounds/desktop/secondary/battlegrounds-tier-list.component';
import { GraphWithSingleValueComponent } from './js/components/battlegrounds/graph-with-single-value.component';
import { BgsHeroSelectionOverviewComponent } from './js/components/battlegrounds/hero-selection/bgs-hero-selection-overview.component';
import { MenuSelectionBgsComponent } from './js/components/battlegrounds/menu-selection-bgs.component';
import { BattlegroundsMinionsTiersOverlayComponent } from './js/components/battlegrounds/minions-tiers/battlegrounds-minions-tiers.component';
import { BattlegroundsOverlayButtonComponent } from './js/components/battlegrounds/overlay/battlegrounds-overlay-button.component';
import { BgsHeroSelectionOverlayComponent } from './js/components/battlegrounds/overlay/bgs-hero-selection-overlay.component';
import { BgsTavernMinionComponent } from './js/components/battlegrounds/overlay/bgs-tavern-minion.component';
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
import { DecktrackerFiltersComponent } from './js/components/decktracker/main/filters/_decktracker-filters.component';
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
import { MenuSelectionDecktrackerComponent } from './js/components/decktracker/main/menu-selection-decktracker.component';
import { DeckTrackerOverlayOpponentComponent } from './js/components/decktracker/overlay/decktracker-overlay-opponent.component';
import { DeckTrackerOverlayPlayerComponent } from './js/components/decktracker/overlay/decktracker-overlay-player.component';
import { GameCountersComponent } from './js/components/game-counters/game-counters.component';
import { GenericCountersComponent } from './js/components/game-counters/generic-counter.component';
import { LoadingComponent } from './js/components/loading/loading.component';
import { MainWindowComponent } from './js/components/main-window.component';
import { FtueComponent } from './js/components/main-window/ftue/ftue.component';
import { GlobalHeaderComponent } from './js/components/main-window/global-header.component';
import { MenuSelectionComponent } from './js/components/menu-selection.component';
import { MercenariesFiltersComponent } from './js/components/mercenaries/desktop/filters/_mercenaries-filters.component';
import { MercenariesFullyUpgradedFilterDropdownComponent } from './js/components/mercenaries/desktop/filters/mercenaries-fully-upgraded-filter-dropdown.component';
import { MercenariesHeroLevelFilterDropdownComponent } from './js/components/mercenaries/desktop/filters/mercenaries-level-filter-dropdown.component';
import { MercenariesOwnedFilterDropdownComponent } from './js/components/mercenaries/desktop/filters/mercenaries-owned-filter-dropdown.component';
import { MercenariesDesktopComponent } from './js/components/mercenaries/desktop/mercenaries-desktop.component';
import { MercenariesEmptyStateComponent } from './js/components/mercenaries/desktop/mercenaries-empty-state.component';
import { MercenariesMyTeamsComponent } from './js/components/mercenaries/desktop/mercenaries-my-teams.component';
import { MercenariesPersonalHeroStatComponent } from './js/components/mercenaries/desktop/mercenaries-personal-hero-stat.component';
import {
	MercenariesPersonalHeroStatsComponent,
	SortableLabelComponent,
} from './js/components/mercenaries/desktop/mercenaries-personal-hero-stats.component';
import { MercenariesPersonalTeamSummaryComponent } from './js/components/mercenaries/desktop/mercenaries-personal-team-summary.component';
import { MercenariesHeroSearchComponent } from './js/components/mercenaries/desktop/secondary/mercenaries-hero-search.component';
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
import { FullScreenOverlaysComponent } from './js/components/overlays/_full-screen-overlays.component';
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
import { ChoosingCardWidgetWrapperComponent } from './js/components/overlays/card-choice/choosing-card-widget-wrapper.component';
import { ConstructedBoardWidgetWrapperComponent } from './js/components/overlays/constructed-board-widget-wrapper.component';
import { AbstractCounterWidgetWrapperComponent } from './js/components/overlays/counters/abstract-counter-widget-wrapper.component';
import { OpponentCounterWidgetWrapperComponent } from './js/components/overlays/counters/opponent-attack-widget-wrapper.component';
import { OpponentPogoWidgetWrapperComponent } from './js/components/overlays/counters/opponent-pogo-widget-wrapper.component';
import { OpponentWatchpostCounterWidgetWrapperComponent } from './js/components/overlays/counters/opponent-watchpost-widget-wrapper.component';
import { PlayerCounterWidgetWrapperComponent } from './js/components/overlays/counters/player-attack-widget-wrapper.component';
import { PlayerBgsMajordomoWidgetWrapperComponent } from './js/components/overlays/counters/player-bgs-majordomo-widget-wrapper.component';
import { PlayerBgsSouthseaWidgetWrapperComponent } from './js/components/overlays/counters/player-bgs-southsea-widget-wrapper.component';
import { PlayerPogoWidgetWrapperComponent } from './js/components/overlays/counters/player-pogo-widget-wrapper.component';
import { PlayerWatchpostCounterWidgetWrapperComponent } from './js/components/overlays/counters/player-watchpost-widget-wrapper.component';
import { CurrentSessionWidgetWrapperComponent } from './js/components/overlays/current-session-widget-wrapper.component';
import { DecktrackerOpponentWidgetWrapperComponent } from './js/components/overlays/decktracker-opponent-widget-wrapper.component';
import { DecktrackerPlayerWidgetWrapperComponent } from './js/components/overlays/decktracker-player-widget-wrapper.component';
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
import { RegionFilterDropdownComponent } from './js/components/replays/filters/region-filter-dropdown.component';
import { ReplaysBgHeroFilterDropdownComponent } from './js/components/replays/filters/replays-bg-hero-filter-dropdown.component';
import { ReplaysDeckstringFilterDropdownComponent } from './js/components/replays/filters/replays-deckstring-filter-dropdown.component';
import { ReplaysGameModeFilterDropdownComponent } from './js/components/replays/filters/replays-game-mode-filter-dropdown.component';
import { ReplaysOpponentClassFilterDropdownComponent } from './js/components/replays/filters/replays-opponent-class-filter-dropdown.component';
import { ReplaysPlayerClassFilterDropdownComponent } from './js/components/replays/filters/replays-player-class-filter-dropdown.component';
import { GameReplayComponent } from './js/components/replays/game-replay.component';
import { GroupedReplaysComponent } from './js/components/replays/grouped-replays.component';
import { MatchDetailsComponent } from './js/components/replays/match-details.component';
import { ReplayInfoComponent } from './js/components/replays/replay-info/_replay-info.component';
import { ReplayInfoBattlegroundsComponent } from './js/components/replays/replay-info/replay-info-battlegrounds.component';
import { ReplayInfoGenericComponent } from './js/components/replays/replay-info/replay-info-generic.component';
import {
	ReplayInfoMercPlayerComponent,
	ReplayInfoMercenariesComponent,
} from './js/components/replays/replay-info/replay-info-mercenaries.component';
import { ReplayInfoRankedComponent } from './js/components/replays/replay-info/replay-info-ranked.component';
import { ReplayIconToggleComponent } from './js/components/replays/replays-icon-toggle.component';
import { ReplaysListViewComponent } from './js/components/replays/replays-list-view.component';
import { ReplaysListComponent } from './js/components/replays/replays-list.component';
import { ReplayMercDetailsToggleComponent } from './js/components/replays/replays-merc-details-toggle.component';
import { ReplaysComponent } from './js/components/replays/replays.component';
import { SecretsHelperControlBarComponent } from './js/components/secrets-helper/secrets-helper-control-bar.component';
import { SecretsHelperWidgetIconComponent } from './js/components/secrets-helper/secrets-helper-widget-icon.component';
import { SecretsHelperComponent } from './js/components/secrets-helper/secrets-helper.component';
import { SettingsComponent } from './js/components/settings/settings.component';
import { StatsFiltersComponent } from './js/components/stats/desktop/filters/_stats-filters.component';
import { StatsXpSeasonFilterDropdownComponent } from './js/components/stats/desktop/filters/stats-xp-season-filter-dropdown.component';
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

import { AdTipComponent } from '@components/ads/ad-tip.component';
import { SingleAdComponent } from '@components/ads/single-ad.component';
import { ArenaRunComponent } from '@components/arena/desktop/arena-run.component';
import { ArenaCardClassFilterDropdownComponent } from '@components/arena/desktop/filters/arena-card-class-filter-dropdown.component';
import { ArenaCardTypeFilterDropdownComponent } from '@components/arena/desktop/filters/arena-card-type-filter-dropdown.component';
import { ArenaHighWinRunsWinsFilterDropdownComponent } from '@components/arena/desktop/filters/arena-high-win-runs-wins-filter-dropdown.component';
import { BattlegroundsMetaStatsHeroesComponent } from '@components/battlegrounds/desktop/categories/meta/battlegrounds-meta-stats-heroes.component';
import { BattlegroundsAnomaliesFilterDropdownComponent } from '@components/battlegrounds/desktop/filters/battlegrounds-anomalies-filter-dropdown.component';
import { BattlegroundsCardTierFilterDropdownComponent } from '@components/battlegrounds/desktop/filters/battlegrounds-card-tier-filter-dropdown.component';
import { BattlegroundsCardTurnFilterDropdownComponent } from '@components/battlegrounds/desktop/filters/battlegrounds-card-turn-filter-dropdown.component';
import { BattlegroundsCardTypeFilterDropdownComponent } from '@components/battlegrounds/desktop/filters/battlegrounds-card-type-filter-dropdown.component';
import { BattlegroundsLeaderboardRegionFilterDropdownComponent } from '@components/battlegrounds/desktop/filters/battlegrounds-leaderboard-region-filter-dropdown.component';
import { BattlegroundsModeFilterDropdownComponent } from '@components/battlegrounds/desktop/filters/battlegrounds-mode-filter-dropdown.component';
import { BattlegroundsQuestTypeFilterDropdownComponent } from '@components/battlegrounds/desktop/filters/battlegrounds-quest-type-filter-dropdown.component';
import { BattlegroundsTrinketTypeFilterDropdownComponent } from '@components/battlegrounds/desktop/filters/battlegrounds-trinket-type-filter-dropdown.component';
import { BattlegroundsYourStatsTypeFilterDropdownComponent } from '@components/battlegrounds/desktop/filters/battlegrounds-your-stats-type-filter-dropdown.component';
import { BgsStrategiesWrapperComponent } from '@components/battlegrounds/desktop/strategy/bgs-strategies-wrapper.component';
import { BgsStrategiesComponent } from '@components/battlegrounds/desktop/strategy/bgs-strategies.component';
import { BgsHeroStrategyTipsTooltipComponent } from '@components/battlegrounds/hero-selection/bgs-hero-strategy-tips-tooltip.component';
import { BgsCompositionsListComponent } from '@components/battlegrounds/minions-tiers/bgs-compositions-list.component';
import { BattlegroundsMinionItemComponent } from '@components/battlegrounds/minions-tiers/bgs-minion-item.component';
import { BgsMinionsListCompositionComponent } from '@components/battlegrounds/minions-tiers/bgs-minions-list-composition.component';
import { BattlegroundsMinionsHighlightButtonsComponent } from '@components/battlegrounds/minions-tiers/minion-highlight-buttons.component';
import { BattlegroundsMinionsListTiersHeader2Component } from '@components/battlegrounds/minions-tiers/minions-list-tiers-header-2.component';
import { BattlegroundsMinionsListTiersHeaderComponent } from '@components/battlegrounds/minions-tiers/minions-list-tiers-header.component';
import { BattlegroundsMinionsTierIconComponent } from '@components/battlegrounds/minions-tiers/tier-icon.component';
import { BattlegroundsTribeDetailsTooltipComponent } from '@components/battlegrounds/overlay/battlegrounds-tribe-details-tooltip.component';
import { BgsHeroOverviewWidgetWrapperComponent } from '@components/battlegrounds/overlay/bgs-hero-overview-widget-wrapper.component';
import { BgsHeroSelectionOverlayInfoComponent } from '@components/battlegrounds/overlay/bgs-hero-selection-overlay-info.component';
import { BgsOverlayHeroOverviewService } from '@components/battlegrounds/overlay/bgs-overlay-hero-overview.service';
import { SetStatsSwitcherComponent } from '@components/collection/set-stats-switcher.component';
import { ControlCloseSimpleComponent } from '@components/controls/control-close-simple.component';
import { ControlCloseComponent } from '@components/controls/control-close.component';
import { ControlWebsiteComponent } from '@components/controls/control-website.component';
import { ConstructedMetaArchetypeDetailsCardsComponent } from '@components/decktracker/main/constructed-meta-archetype-details-cards.component';
import { ConstructedMetaArchetypeDetailsComponent } from '@components/decktracker/main/constructed-meta-archetype-details.component';
import { ConstructedMetaArchetypeComponent } from '@components/decktracker/main/constructed-meta-archetype.component';
import { ConstructedMetaArchetypesComponent } from '@components/decktracker/main/constructed-meta-archetypes.component';
import { ConstructedMetaDeckDetailsCardStatsComponent } from '@components/decktracker/main/constructed-meta-deck-details-card-stats.component';
import { ConstructedMetaDeckDetailsCardsComponent } from '@components/decktracker/main/constructed-meta-deck-details-cards.component';
import { ConstructedMetaDeckDetailsDiscoverStatsComponent } from '@components/decktracker/main/constructed-meta-deck-details-discover-stats.component';
import { ConstructedMetaDeckDetailsMatchupsComponent } from '@components/decktracker/main/constructed-meta-deck-details-matchups.component';
import { ConstructedMetaDeckDetailsViewComponent } from '@components/decktracker/main/constructed-meta-deck-details-view.component';
import { ConstructedMetaDeckDetailsComponent } from '@components/decktracker/main/constructed-meta-deck-details.component';
import { ConstructedArchetypeSampleSizeFilterDropdownComponent } from '@components/decktracker/main/filters/constructed-archetype-sample-size-filter-dropdown.component';
import { ConstructedMetaDeckCardSearchComponent } from '@components/decktracker/main/filters/constructed-meta-deck-card-search.component';
import { ConstructedPlayerArchetypeFilterDropdownComponent } from '@components/decktracker/main/filters/constructed-player-archetype-filter-dropdown.component';
import { ConstructedPlayerClassFilterDropdownComponent } from '@components/decktracker/main/filters/constructed-player-class-filter-dropdown.component';
import { ConstructedSampleSizeFilterDropdownComponent } from '@components/decktracker/main/filters/constructed-sample-size-filter-dropdown.component';
import { DecktrackerPlayerClassFilterDropdownComponent } from '@components/decktracker/main/filters/decktracker-player-class-filter-dropdown.component';
import { DeckListStaticComponent } from '@components/decktracker/overlay/deck-list-static.component';
import { DkRunesComponent } from '@components/decktracker/overlay/dk-runes.component';
import { BattlegroundsMinionsTiersTwitchOverlayComponent } from '@components/decktracker/overlay/twitch/battlegrounds-minions-tiers-twitch.component';
import { DeckTrackerOverlayContainerComponent } from '@components/decktracker/overlay/twitch/decktracker-overlay-container.component.ts';
import { DeckTrackerOverlayStandaloneComponent } from '@components/decktracker/overlay/twitch/decktracker-overlay-standalone.component';
import { DeckTrackerTwitchTitleBarComponent } from '@components/decktracker/overlay/twitch/decktracker-twitch-title-bar.component';
import { EmptyCardComponent } from '@components/decktracker/overlay/twitch/empty-card.component';
import { StateMouseOverComponent } from '@components/decktracker/overlay/twitch/state-mouse-over.component';
import { TwitchCardsFacadeManagerService } from '@components/decktracker/overlay/twitch/twitch-cards-facade-manager.service';
import { TwitchConfigWidgetComponent } from '@components/decktracker/overlay/twitch/twitch-config-widget.component';
import { TwitchLocalizationManagerService } from '@components/decktracker/overlay/twitch/twitch-localization-manager.service';
import { LotteryAchievementComponent } from '@components/lottery/lottery-achievement.component';
import { LotteryAchievementsWidgetComponent } from '@components/lottery/lottery-achievements.component';
import { LotteryLotteryWidgetComponent } from '@components/lottery/lottery-lottery.component';
import { LotteryNavigationComponent } from '@components/lottery/lottery-navigation.component';
import { LotteryWidgetWrapperComponent } from '@components/lottery/lottery-widget-wrapper.component';
import { LotteryWindowComponent } from '@components/lottery/lottery-window.component';
import { LotteryWidgetComponent } from '@components/lottery/lottery.component';
import { ArenaCardSelectionWidgetWrapperComponent } from '@components/overlays/arena-card-selection-widget-wrapper.component';
import { ArenaDecktrackerOocWidgetWrapperComponent } from '@components/overlays/arena-decktracker-ooc-widget-wrapper.component';
import { ArenaHeroSelectionWidgetWrapperComponent } from '@components/overlays/arena-hero-selection-widget-wrapper.component';
import { ArenaMulliganDeckWidgetWrapperComponent } from '@components/overlays/arena-mulligan-deck-widget-wrapper.component';
import { ArenaMulliganWidgetWrapperComponent } from '@components/overlays/arena-mulligan-widget-wrapper.component';
import { ArenaDecktrackerOocComponent } from '@components/overlays/arena/arena-decktracker-ooc.component';
import { ChoosingCardOptionArenaComponent } from '@components/overlays/card-choice/choosing-card-option-arena.component';
import { ChoosingCardOptionConstructedComponent } from '@components/overlays/card-choice/choosing-card-option-constructed.component';
import { ChoosingCardOptionComponent } from '@components/overlays/card-choice/choosing-card-option.component';
import { ConstructedMulliganDeckWidgetWrapperComponent } from '@components/overlays/constructed-mulligan-deck-widget-wrapper.component';
import { ConstructedMulliganHandWidgetWrapperComponent } from '@components/overlays/constructed-mulligan-hand-widget-wrapper.component';
import { ConstructedDecktrackerExtendedOocComponent } from '@components/overlays/constructed/constructed-decktracker-extended-ooc.component';
import { ConstructedDecktrackerOocWidgetWrapperComponent } from '@components/overlays/constructed/constructed-decktracker-ooc-widget-wrapper.component';
import { ConstructedDecktrackerOocComponent } from '@components/overlays/constructed/constructed-decktracker-ooc.component';
import { PlayerBgsBloodGemWidgetWrapperComponent } from '@components/overlays/counters/player-bgs-blood-gem-widget-wrapper.component';
import { PlayerBgsLordOfGainsWidgetWrapperComponent } from '@components/overlays/counters/player-bgs-lord-of-gains-widget-wrapper.component';
import { PlayerBgsMagmalocWidgetWrapperComponent } from '@components/overlays/counters/player-bgs-magmaloc-widget-wrapper.component';
import { PlayerBgsTuskarrRaiderWidgetWrapperComponent } from '@components/overlays/counters/player-bgs-tuskarr-raider-widget-wrapper.component';
import { ChoosingBgsQuestWidgetWrapperComponent } from '@components/overlays/quests/choosing-bgs-quest-widget-wrapper.component';
import { ChoosingCardBgsQuestOptionComponent } from '@components/overlays/quests/choosing-card-bgs-quest-option.component';
import { MaxResourcesWidgetComponent } from '@components/overlays/resources/max-resources-widget.component';
import { OpponentMaxResourcesWidgetWrapperComponent } from '@components/overlays/resources/opponent-max-resources-widget-wrapper.component';
import { PlayerMaxResourcesWidgetWrapperComponent } from '@components/overlays/resources/player-max-resources-widget-wrapper.component';
import { BgsHeroTipsWidgetWrapperComponent } from '@components/overlays/tips/bgs-hero-tips-widget-wrapper.component';
import { BgsHeroTipsComponent } from '@components/overlays/tips/bgs-hero-tips.component';
import { ChoosingBgsTrinketWidgetWrapperComponent } from '@components/overlays/trinket/choosing-bgs-trinket-widget-wrapper.component';
import { ChoosingCardBgsTrinketOptionComponent } from '@components/overlays/trinket/choosing-card-bgs-trinket-option.component';
import { ProfileMatchStatsClassInfoComponent } from '@components/stats/desktop/match-stats/profile-match-stats-class-info.component';
import { ProfileMatchStatsModeOverviewComponent } from '@components/stats/desktop/match-stats/profile-match-stats-mode-overview.component';
import { ProfileMatchStatsComponent } from '@components/stats/desktop/match-stats/profile-match-stats.component';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { AchievementsCommonModule, REMOTE_ACHIEVEMENTS_SERVICE_TOKEN } from '@firestone/achievements/common';
import { AchievementsDataAccessModule } from '@firestone/achievements/data-access';
import { AchievementsViewModule } from '@firestone/achievements/view';
import { AppCommonModule, LocalizationLoaderWithCache } from '@firestone/app/common';
import {
	ARENA_DRAFT_MANAGER_SERVICE_TOKEN,
	ArenaCommonModule,
	ArenaDraftManagerService,
} from '@firestone/arena/common';
import { BattlegroundsCommonModule } from '@firestone/battlegrounds/common';
import {
	BattlegroundsCoreModule,
	BgsBattleSimulationExecutorService,
	BgsBattleSimulationMockExecutorService,
} from '@firestone/battlegrounds/core';
import { BattlegroundsDataAccessModule } from '@firestone/battlegrounds/data-access';
import {
	BattlegroundsSimulatorModule,
	BgsBattlePositioningExecutorService,
	BgsBattlePositioningMockExecutorService,
} from '@firestone/battlegrounds/simulator';
import { BattlegroundsViewModule } from '@firestone/battlegrounds/view';
import {
	COLLECTION_MANAGER_SERVICE_TOKEN,
	COLLECTION_PACK_SERVICE_TOKEN,
	CollectionCommonModule,
} from '@firestone/collection/common';
import { CollectionViewModule } from '@firestone/collection/view';
import { CommunitiesCommonModule } from '@firestone/communities/common';
import { ConstructedCommonModule } from '@firestone/constructed/common';
import { DiscordModule } from '@firestone/discord';
import { GameStateModule, REVIEW_ID_SERVICE_TOKEN } from '@firestone/game-state';
import { MainwindowCommonModule } from '@firestone/mainwindow/common';
import { MemoryModule } from '@firestone/memory';
import { MercenariesCommonModule } from '@firestone/mercenaries/common';
import { ModsCommonModule } from '@firestone/mods/common';
import { ReplayColiseumModule } from '@firestone/replay/coliseum';
import { SettingsModule } from '@firestone/settings';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { CdkOverlayContainer, Store } from '@firestone/shared/framework/common';
import {
	ADS_SERVICE_TOKEN,
	CARDS_HIGHLIGHT_SERVICE_TOKEN,
	CardsFacadeService,
	ILocalizationService,
	PLAUSIBLE_DOMAIN,
	SharedFrameworkCoreModule,
	setAppInjector,
} from '@firestone/shared/framework/core';
import { GAME_STATS_PROVIDER_SERVICE_TOKEN, StatsCommonModule } from '@firestone/stats/common';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { TwitchCommonModule } from '@firestone/twitch/common';
import { MailboxDesktopComponent } from '@mails/components/mailbox-desktop.component';
import { MailboxMessageComponent } from '@mails/components/mailbox-message/mailbox-message.component';
import { MailboxComponent } from '@mails/components/mailbox/mailbox.component';
import { MailsService } from '@mails/services/mails.service';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
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
import { BgsBattleSideComponent } from './js/components/battlegrounds/battles/bgs-battle-side.component';
import { BgsBattleComponent } from './js/components/battlegrounds/battles/bgs-battle.component';
import { BgsBattlesViewComponent } from './js/components/battlegrounds/battles/bgs-battles-view.component';
import { GraphWithComparisonNewComponent } from './js/components/battlegrounds/graph-with-comparison-new.component';
import { BgsHeroMiniComponent } from './js/components/battlegrounds/hero-selection/bgs-hero-mini.component';
import { BgsHeroOverviewComponent } from './js/components/battlegrounds/hero-selection/bgs-hero-overview.component';
import { BgsHeroSelectionTooltipComponent } from './js/components/battlegrounds/hero-selection/bgs-hero-selection-tooltip.component';
import { BgsHeroStatsComponent } from './js/components/battlegrounds/hero-selection/bgs-hero-stats.component';
import { BgsHeroTierComponent } from './js/components/battlegrounds/hero-selection/bgs-hero-tier.component.ts';
import { BgsHeroTribesComponent } from './js/components/battlegrounds/hero-selection/bgs-hero-tribes.component';
import { BgsHeroFaceOffComponent } from './js/components/battlegrounds/in-game/bgs-hero-face-off.component';
import { BgsHeroFaceOffsComponent } from './js/components/battlegrounds/in-game/bgs-hero-face-offs.component';
import { BgsNextOpponentOverviewComponent } from './js/components/battlegrounds/in-game/bgs-next-opponent-overview.component';
import { BgsOpponentOverviewComponent } from './js/components/battlegrounds/in-game/bgs-opponent-overview.component';
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
import { CardComponent } from './js/components/collection/card.component';
import { BasicBarChartComponent } from './js/components/common/chart/basic-bar-chart.component';
import { ControlBugComponent } from './js/components/controls/control-bug.component';
import { ControlDiscordComponent } from './js/components/controls/control-discord.component';
import { ControlHelpComponent } from './js/components/controls/control-help.component';
import { ControlMaximizeComponent } from './js/components/controls/control-maximize.component';
import { ControlMinimizeComponent } from './js/components/controls/control-minimize.component';
import { ControlSettingsComponent } from './js/components/controls/control-settings.component';
import { ControlShareComponent } from './js/components/controls/control-share.component';
import { ImportDeckstringComponent } from './js/components/decktracker/import-deckstring.component';
import { ConstructedDustFilterDropdownComponent } from './js/components/decktracker/main/filters/constructed-dust-filter-dropdown.component';
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
import { FilterComponent } from './js/components/filter.component';
import { FsFilterDropdownComponent } from './js/components/fs-filter-dropdown.component';
import { HotkeyComponent } from './js/components/hotkey.component';
import { SecondaryDefaultComponent } from './js/components/main-window/secondary-default.component';
import { SecretsHelperListComponent } from './js/components/secrets-helper/secrets-helper-list.component';
import { DropdownComponent } from './js/components/settings/dropdown.component';
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
import { ActiveThemeDirective } from './js/directives/active-theme.directive';
import { AskConfirmationDirective } from './js/directives/ask-confirmation.directive';
import { BindCssVariableDirective } from './js/directives/bind-css-variable-directive';
import { DoubleClickDirective } from './js/directives/exclusive-double-click.directive';
import { GrowOnClickDirective } from './js/directives/grow-on-click.directive';
import { NgxCacheIfDirective } from './js/directives/ngx-cache-if.directive';
import { OwTranslateDirective } from './js/directives/ow-translate.directive';
import { OwTranslatePipe } from './js/directives/ow-translate.pipe';
import { PulseDirective } from './js/directives/pulse.directive';
import { RippleOnClickDirective } from './js/directives/ripple-on-click.directive';
import { RotateOnMouseOverDirective } from './js/directives/rotate-on-mouse-over.directive';
import { AchievementHistoryStorageService } from './js/services/achievement/achievement-history-storage.service';
import { AchievementHistoryService } from './js/services/achievement/achievements-history.service';
import { AchievementsLiveProgressTrackingService } from './js/services/achievement/achievements-live-progress-tracking.service';
import { AchievementsNotificationService } from './js/services/achievement/achievements-notification.service';
import { AchievementsStateManagerService } from './js/services/achievement/achievements-state-manager.service';
import { AchievementsStorageService } from './js/services/achievement/achievements-storage.service';
import { ChallengeBuilderService } from './js/services/achievement/achievements/challenges/challenge-builder.service';
import { AchievementsMemoryMonitor } from './js/services/achievement/data/achievements-memory-monitor.service';
import { FirestoneRemoteAchievementsLoaderService } from './js/services/achievement/data/firestone-remote-achievements-loader.service';
import { RawAchievementsLoaderService } from './js/services/achievement/data/raw-achievements-loader.service';
import { FirestoneAchievementsChallengeService } from './js/services/achievement/firestone-achievements-challenges.service';
import { AdService } from './js/services/ad.service';
import { HearthArenaAnalyticsService } from './js/services/analytics/heartharena-analytics.service';
import { ArenaLastMatchService } from './js/services/arena/arena-last-match.service';
import { BgsBestUserStatsService } from './js/services/battlegrounds/bgs-best-user-stats.service';
import { BgsCustomSimulationService } from './js/services/battlegrounds/bgs-custom-simulation-service.service';
import { BgsGlobalStatsService } from './js/services/battlegrounds/bgs-global-stats.service';
import { BgsPerfectGamesService } from './js/services/battlegrounds/bgs-perfect-games.service';
import { BgsRunStatsService } from './js/services/battlegrounds/bgs-run-stats.service';
import { BattlegroundsStoreService } from './js/services/battlegrounds/store/battlegrounds-store.service';
import { RealTimeStatsService } from './js/services/battlegrounds/store/real-time-stats/real-time-stats.service';
import { CardsInitService } from './js/services/cards-init.service';
import { CardNotificationsService } from './js/services/collection/card-notifications.service';
import { CardsMonitorService } from './js/services/collection/cards-monitor.service';
import { CollectionManager } from './js/services/collection/collection-manager.service';
import { CollectionStorageService } from './js/services/collection/collection-storage.service';
import { SetsManagerService } from './js/services/collection/sets-manager.service';
import { SetsService } from './js/services/collection/sets-service.service';
import { DebugService } from './js/services/debug.service';
import { AiDeckService } from './js/services/decktracker/ai-deck-service.service';
import { AttackOnBoardService } from './js/services/decktracker/attack-on-board.service';
import { CardsHighlightFacadeService } from './js/services/decktracker/card-highlight/cards-highlight-facade.service';
import { CardsHighlightService } from './js/services/decktracker/card-highlight/cards-highlight.service';
import { ConstructedArchetypeServiceOrchestrator } from './js/services/decktracker/constructed-archetype-orchestrator.service';
import { ConstructedConfigService } from './js/services/decktracker/constructed-config.service';
import { DeckCardService } from './js/services/decktracker/deck-card.service';
import { DeckParserFacadeService } from './js/services/decktracker/deck-parser-facade.service';
import { DeckParserService } from './js/services/decktracker/deck-parser.service';
import { DynamicZoneHelperService } from './js/services/decktracker/dynamic-zone-helper.service';
import { DeckManipulationHelper } from './js/services/decktracker/event-parser/deck-manipulation-helper';
import { SecretsParserService } from './js/services/decktracker/event-parser/secrets/secrets-parser.service';
import { GameStateMetaInfoService } from './js/services/decktracker/game-state-meta-info.service';
import { GameStateService } from './js/services/decktracker/game-state.service';
import { GameStateParsersService } from './js/services/decktracker/game-state/state-parsers.service';
import { StatePostProcessService } from './js/services/decktracker/game-state/state-post-process.service';
import { DecksProviderService } from './js/services/decktracker/main/decks-provider.service';
import { DecktrackerStateLoaderService } from './js/services/decktracker/main/decktracker-state-loader.service';
import { OverlayDisplayService } from './js/services/decktracker/overlay-display.service';
import { SecretConfigService } from './js/services/decktracker/secret-config.service';
import { ZoneOrderingService } from './js/services/decktracker/zone-ordering.service';
import { DevService } from './js/services/dev.service';
import { Events } from './js/services/events.service';
import { GameEventsEmitterService } from './js/services/game-events-emitter.service';
import { GameEvents } from './js/services/game-events.service';
import { GameModeDataService } from './js/services/game-mode-data.service';
import { GameNativeStateStoreService } from './js/services/game/game-native-state-store.service';
import { GlobalStatsNotifierService } from './js/services/global-stats/global-stats-notifier.service';
import { GlobalStatsService } from './js/services/global-stats/global-stats.service';
import { HotkeyService } from './js/services/hotkey.service';
import { HsClientConfigService } from './js/services/hs-client-config.service';
import { LazyDataInitService } from './js/services/lazy-data-init.service';
import { LocalizationFacadeService } from './js/services/localization-facade.service';
import { LocalizationService } from './js/services/localization.service';
import { LogListenerService } from './js/services/log-listener.service';
import { LogRegisterService } from './js/services/log-register.service';
import { LotteryWidgetControllerService } from './js/services/lottery/lottery-widget-controller.service';
import { LotteryService } from './js/services/lottery/lottery.service';
import { LiveStreamsService } from './js/services/mainwindow/live-streams.service';
import { OutOfCardsService } from './js/services/mainwindow/out-of-cards.service';
import { CollectionBootstrapService } from './js/services/mainwindow/store/collection-bootstrap.service';
import { MainWindowStateFacadeService } from './js/services/mainwindow/store/main-window-state-facade.service';
import { MainWindowStoreService } from './js/services/mainwindow/store/main-window-store.service';
import { StoreBootstrapService } from './js/services/mainwindow/store/store-bootstrap.service';
import { TwitchPresenceService } from './js/services/mainwindow/twitch-presence.service';
import { EndGameListenerService } from './js/services/manastorm-bridge/end-game-listener.service';
import { EndGameUploaderService } from './js/services/manastorm-bridge/end-game-uploader.service';
import { GameParserService } from './js/services/manastorm-bridge/game-parser.service';
import { ReplayUploadService } from './js/services/manastorm-bridge/replay-upload.service';
import { MercenariesSynergiesHighlightService } from './js/services/mercenaries/highlights/mercenaries-synergies-highlight.service';
import { MercenariesMemoryCacheService } from './js/services/mercenaries/mercenaries-memory-cache.service';
import { MercenariesReferenceDataService } from './js/services/mercenaries/mercenaries-reference-data.service';
import { MercenariesStoreService } from './js/services/mercenaries/mercenaries-store.service';
import { MercenariesOutOfCombatService } from './js/services/mercenaries/out-of-combat/mercenaries-out-of-combat.service';
import { GameEventsPluginService } from './js/services/plugins/game-events-plugin.service';
import { InternalProfileAchievementsService } from './js/services/profile/internal/internal-profile-achievements.service';
import { InternalProfileBattlegroundsService } from './js/services/profile/internal/internal-profile-battlegrounds.service';
import { InternalProfileCollectionService } from './js/services/profile/internal/internal-profile-collection.service';
import { InternalProfileInfoService } from './js/services/profile/internal/internal-profile-info.service';
import { ProfileUploaderService } from './js/services/profile/profile-uploader.service';
import { QuestsService } from './js/services/quests.service';
import { ReplaysNotificationService } from './js/services/replays/replays-notification.service';
import { ReviewIdService } from './js/services/review-id.service';
import { RewardMonitorService } from './js/services/rewards/rewards-monitor';
import { GameStatsProviderService } from './js/services/stats/game/game-stats-provider.service';
import { GameStatsUpdaterService } from './js/services/stats/game/game-stats-updater.service';
import { MatchStatsService } from './js/services/stats/match-stats.service';
import { SystemTrayService } from './js/services/system-tray.service';
import { TipService } from './js/services/tip.service';
import { AppUiStoreFacadeService } from './js/services/ui-store/app-ui-store-facade.service';
import { AppUiStoreService } from './js/services/ui-store/app-ui-store.service';
import { AppBootstrapService } from './libs/boostrap/app-bootstrap.service';
import { AppStartupService } from './libs/boostrap/app-startup.service';
import { BootstrapEssentialServicesService } from './libs/boostrap/bootstrap-essential-services.service';
import { BootstrapOtherServicesService } from './libs/boostrap/bootstrap-other-services.service';
import { BootstrapStoreServicesService } from './libs/boostrap/bootstrap-store-services.service';

console.log('environment is ' + process.env['NODE_ENV']);

try {
	overwolf?.extensions.current.getManifest((manifestResult) => {
		process.env['APP_VERSION'] = manifestResult.meta.version;
		console.log('version is ' + process.env['APP_VERSION']);

		overwolf.settings.getExtensionSettings((settingsResult) => {
			// const sampleRate = settingsResult?.settings?.channel === 'beta' ? 1 : 0.1;
			process.env['APP_CHANNEL'] = settingsResult?.settings?.channel;
		});
	});
} catch (e) {
	console.log('could not gt overwolf info, continuing', e);
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

		AppCommonModule,
		SharedCommonViewModule,
		SharedFrameworkCoreModule,
		ReplayColiseumModule,
		BattlegroundsDataAccessModule,
		BattlegroundsViewModule,
		BattlegroundsCommonModule,
		BattlegroundsSimulatorModule,
		BattlegroundsCoreModule,
		StatsDataAccessModule,
		CollectionViewModule,
		AchievementsViewModule,
		AchievementsDataAccessModule,
		AchievementsCommonModule,
		ArenaCommonModule,
		DiscordModule,
		MemoryModule,
		GameStateModule,
		StatsCommonModule,
		ConstructedCommonModule,
		CommunitiesCommonModule,
		CollectionCommonModule,
		MercenariesCommonModule,
		MainwindowCommonModule,
		SettingsModule,
		TwitchCommonModule,
		ModsCommonModule,

		ColiseumComponentsModule,
		NgxChartsModule,
		NgChartsModule,
		TranslateModule.forRoot({
			defaultLanguage: 'enUS',
			loader: { provide: TranslateLoader, useExisting: LocalizationLoaderWithCache },
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
		ControlCloseSimpleComponent,
		ControlSettingsComponent,
		ControlDiscordComponent,
		ControlWebsiteComponent,
		ControlBugComponent,
		ControlShareComponent,

		HotkeyComponent,
		VersionComponent,

		ConfirmationComponent,

		ActiveThemeDirective,
		PulseDirective,
		AskConfirmationDirective,
		BindCssVariableDirective,
		GrowOnClickDirective,
		RippleOnClickDirective,
		NgxCacheIfDirective,
		RotateOnMouseOverDirective,
		DoubleClickDirective,
		OwTranslateDirective,

		DropdownComponent,

		FilterComponent,
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
		DeckListComponent,
		DeckListStaticComponent,
		DkRunesComponent,

		BgsHeroTribesComponent,
		MinionIconComponent,
		BgsHeroTierComponent,
		BgsHeroMiniComponent,
		BgsHeroSelectionTooltipComponent,
		BgsHeroStrategyTipsTooltipComponent,
		BgsHeroStatsComponent,
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
		BgsStrategiesWrapperComponent,

		BattlegroundsMinionsTiersViewOverlayComponent,
		BgsCompositionsListComponent,
		BattlegroundsMinionsListComponent,
		BattlegroundsMinionsGroupComponent,
		BattlegroundsMinionsTierIconComponent,
		BattlegroundsMinionsListTiersHeaderComponent,
		BattlegroundsMinionsListTiersHeader2Component,
		BattlegroundsMinionsHighlightButtonsComponent,
		BattlegroundsMinionItemComponent,
		BgsMinionsListCompositionComponent,

		BgsBattlesViewComponent,
		BgsBattleComponent,
		BgsBattleSideComponent,

		BgsLeaderboardEmptyCardComponent,
		BgsOverlayHeroOverviewComponent,

		GraphWithComparisonNewComponent,
		BasicBarChartComponent,
		PieChartComponent,

		FsFilterDropdownComponent,

		StatCellComponent,

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

		HotkeyComponent,
		VersionComponent,

		ConfirmationComponent,

		ActiveThemeDirective,
		PulseDirective,
		AskConfirmationDirective,
		BindCssVariableDirective,
		GrowOnClickDirective,
		RippleOnClickDirective,
		NgxCacheIfDirective,
		RotateOnMouseOverDirective,
		DoubleClickDirective,
		OwTranslateDirective,

		FilterComponent,
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
		AdTipComponent,

		DeckCardComponent,
		DeckTrackerDeckListComponent,
		DeckListByZoneComponent,
		GroupedDeckListComponent,
		DeckZoneComponent,
		DeckListStaticComponent,

		BgsHeroTribesComponent,
		MinionIconComponent,
		BgsHeroTierComponent,
		BgsHeroMiniComponent,
		BgsHeroStrategyTipsTooltipComponent,
		BgsHeroStatsComponent,
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
		BattlegroundsTribeDetailsTooltipComponent,

		BattlegroundsMinionsListComponent,

		BgsBattlesViewComponent,
		BgsBattleComponent,
		BgsBattleSideComponent,

		BgsLeaderboardEmptyCardComponent,
		BgsHeroShortRecapComponent,
		BgsOverlayHeroOverviewComponent,

		GraphWithComparisonNewComponent,
		BasicBarChartComponent,
		PieChartComponent,

		FsFilterDropdownComponent,

		StatCellComponent,

		// Only for the app
		DaemonComponent,
		MainWindowComponent,
		LoadingComponent,
		NotificationsComponent,
		BattlegroundsComponent,
		FullScreenOverlaysComponent,
		BattlegroundsMinionsTiersOverlayComponent,
		BattlegroundsOverlayButtonComponent,
		BgsBannedTribesComponent,
		BgsHeroTipsComponent,
		BgsHeroSelectionOverlayComponent,
		BgsHeroSelectionOverlayInfoComponent,
		// ConstructedComponent,
		DeckTrackerOverlayPlayerComponent,
		DeckTrackerOverlayOpponentComponent,
		GameCountersComponent,
		OpponentHandOverlayComponent,
		OutOfCardsCallbackComponent,
		SecretsHelperComponent,
		PlayerMaxResourcesWidgetWrapperComponent,
		OpponentMaxResourcesWidgetWrapperComponent,
		MaxResourcesWidgetComponent,

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
		SetStatsSwitcherComponent,
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
		ConstructedMetaDeckDetailsComponent,
		ConstructedMetaDeckDetailsViewComponent,
		ConstructedMetaDeckDetailsCardStatsComponent,
		ConstructedMetaDeckDetailsDiscoverStatsComponent,
		ConstructedMetaDeckDetailsCardsComponent,
		ConstructedMetaDeckDetailsMatchupsComponent,
		ConstructedMetaArchetypeDetailsCardsComponent,
		ConstructedMetaArchetypesComponent,
		ConstructedMetaArchetypeComponent,
		ConstructedMetaArchetypeDetailsComponent,
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
		ConstructedSampleSizeFilterDropdownComponent,
		ConstructedDustFilterDropdownComponent,
		ConstructedArchetypeSampleSizeFilterDropdownComponent,
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
		ConstructedPlayerClassFilterDropdownComponent,
		DecktrackerPlayerClassFilterDropdownComponent,
		ConstructedPlayerArchetypeFilterDropdownComponent,
		ConstructedMetaDeckCardSearchComponent,

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
		ReplayInfoGenericComponent,
		MatchDetailsComponent,
		GameReplayComponent,
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
		BattlegroundsMetaStatsHeroesComponent,
		BattlegroundsPersonalStatsQuestsComponent,
		BattlegroundsStatsQuestVignetteComponent,
		BattlegroundsPersonalStatsRatingComponent,
		BattlegroundsPerfectGamesComponent,
		BattlegroundsSimulatorComponent,
		BattlegroundsPersonalStatsStatsComponent,
		BattlegroundsPersonalStatsHeroDetailsComponent,
		BattlegroundsTierListComponent,
		BattlegroundsHeroesRecordsBrokenComponent,
		BattlegroundsHeroRecordsBrokenComponent,
		BattlegroundsReplaysRecapComponent,
		BgsLastWarbandsComponent,
		BgsStrategiesComponent,
		BgsMmrEvolutionForHeroComponent,
		BgsWarbandStatsForHeroComponent,
		BgsWinrateStatsForHeroComponent,
		BgsHeroDetailedStatsComponent,
		BgsGlobalValueComponent,
		BattlegroundsFiltersComponent,
		BattlegroundsHeroSortDropdownComponent,
		BattlegroundsHeroFilterDropdownComponent,
		BattlegroundsRankFilterDropdownComponent,
		BattlegroundsTribesFilterDropdownComponent,
		BattlegroundsAnomaliesFilterDropdownComponent,
		BattlegroundsRankGroupDropdownComponent,
		BattlegroundsTimeFilterDropdownComponent,
		BattlegroundsQuestTypeFilterDropdownComponent,
		BattlegroundsModeFilterDropdownComponent,
		BattlegroundsLeaderboardRegionFilterDropdownComponent,
		BattlegroundsTrinketTypeFilterDropdownComponent,
		BattlegroundsYourStatsTypeFilterDropdownComponent,
		BattlegroundsCardTypeFilterDropdownComponent,
		BattlegroundsCardTierFilterDropdownComponent,
		BattlegroundsCardTurnFilterDropdownComponent,

		ArenaDesktopComponent,
		ArenaEmptyStateComponent,
		ArenaRunsListComponent,
		ArenaClassesRecapComponent,
		ArenaFiltersComponent,
		ArenaTimeFilterDropdownComponent,
		ArenaClassFilterDropdownComponent,
		ArenaHighWinRunsWinsFilterDropdownComponent,
		ArenaCardClassFilterDropdownComponent,
		ArenaCardTypeFilterDropdownComponent,
		ArenaRunComponent,

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
		MercenariesHeroSearchComponent,
		MercenariesEmptyStateComponent,
		MercenariesTeamAbilityComponent,
		MercenariesActionComponent,

		SortableLabelComponent,
		MercenariesFiltersComponent,
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
		ProfileMatchStatsComponent,
		ProfileMatchStatsModeOverviewComponent,
		ProfileMatchStatsClassInfoComponent,

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
		ChoosingCardOptionArenaComponent,
		ChoosingCardOptionConstructedComponent,
		ChoosingBgsQuestWidgetWrapperComponent,
		ChoosingCardBgsQuestOptionComponent,
		ChoosingBgsTrinketWidgetWrapperComponent,
		ChoosingCardBgsTrinketOptionComponent,

		ArenaHeroSelectionWidgetWrapperComponent,
		ArenaCardSelectionWidgetWrapperComponent,
		ArenaDecktrackerOocWidgetWrapperComponent,
		ArenaDecktrackerOocComponent,
		ConstructedDecktrackerOocComponent,
		ConstructedDecktrackerExtendedOocComponent,
		ConstructedDecktrackerOocWidgetWrapperComponent,
		ConstructedMulliganHandWidgetWrapperComponent,
		ConstructedMulliganDeckWidgetWrapperComponent,
		ArenaMulliganDeckWidgetWrapperComponent,
		ArenaMulliganWidgetWrapperComponent,

		LotteryWidgetWrapperComponent,
		LotteryWidgetComponent,
		LotteryNavigationComponent,
		LotteryLotteryWidgetComponent,
		LotteryAchievementsWidgetComponent,
		LotteryAchievementComponent,
		LotteryWindowComponent,

		BgsMinionsTiersWidgetWrapperComponent,
		BgsBattleSimulationWidgetWrapperComponent,
		BgsBannedTribesWidgetWrapperComponent,
		BgsHeroTipsWidgetWrapperComponent,
		BgsWindowButtonWidgetWrapperComponent,
		BgsHeroSelectionWidgetWrapperComponent,
		BgsLeaderboardWidgetWrapperComponent,
		BgsHeroOverviewWidgetWrapperComponent,
		BgsBoardWidgetWrapperComponent,

		MercsPlayerTeamWidgetWrapperComponent,
		MercsOpponentTeamWidgetWrapperComponent,
		MercsActionQueueWidgetWrapperComponent,
		MercsOutOfCombatPlayerTeamWidgetWrapperComponent,
		MercsTreasureSelectionWidgetWrapperComponent,

		AbstractCounterWidgetWrapperComponent,
		PlayerCounterWidgetWrapperComponent,
		PlayerWatchpostCounterWidgetWrapperComponent,
		PlayerPogoWidgetWrapperComponent,
		PlayerBgsSouthseaWidgetWrapperComponent,
		PlayerBgsMagmalocWidgetWrapperComponent,
		PlayerBgsMajordomoWidgetWrapperComponent,
		PlayerBgsBloodGemWidgetWrapperComponent,
		PlayerBgsLordOfGainsWidgetWrapperComponent,
		PlayerBgsTuskarrRaiderWidgetWrapperComponent,

		OpponentCounterWidgetWrapperComponent,
		OpponentWatchpostCounterWidgetWrapperComponent,
		OpponentPogoWidgetWrapperComponent,

		FtueComponent,

		MercenariesHighlightDirective,
		AutofocusDirective,

		// Twitch
		LeaderboardEmptyCardComponent,
		BattlegroundsMinionsTiersTwitchOverlayComponent,
		DeckTrackerOverlayContainerComponent,
		DeckTrackerOverlayStandaloneComponent,
		DeckTrackerTwitchTitleBarComponent,
		EmptyCardComponent,
		LeaderboardEmptyCardComponent,
		StateMouseOverComponent,
		TwitchConfigWidgetComponent,
	],
	providers: [
		{ provide: OverlayContainer, useClass: CdkOverlayContainer },
		// Why??
		{ provide: BgsBattleSimulationExecutorService, useClass: BgsBattleSimulationMockExecutorService },
		{ provide: BgsBattlePositioningExecutorService, useClass: BgsBattlePositioningMockExecutorService },
		{ provide: CARDS_HIGHLIGHT_SERVICE_TOKEN, useExisting: CardsHighlightFacadeService },
		{ provide: ARENA_DRAFT_MANAGER_SERVICE_TOKEN, useExisting: ArenaDraftManagerService },
		{ provide: ADS_SERVICE_TOKEN, useExisting: AdService },
		{ provide: COLLECTION_MANAGER_SERVICE_TOKEN, useExisting: CollectionManager },
		{ provide: COLLECTION_PACK_SERVICE_TOKEN, useExisting: PackStatsService },
		{ provide: REMOTE_ACHIEVEMENTS_SERVICE_TOKEN, useExisting: FirestoneRemoteAchievementsLoaderService },
		{ provide: GAME_STATS_PROVIDER_SERVICE_TOKEN, useExisting: GameStatsProviderService },
		{ provide: REVIEW_ID_SERVICE_TOKEN, useExisting: ReviewIdService },
		{ provide: PLAUSIBLE_DOMAIN, useValue: 'firestoneapp.gg-app' },

		SetsService,
		DebugService,
		Events,

		AchievementHistoryStorageService,
		AchievementHistoryService,

		ChallengeBuilderService,
		RawAchievementsLoaderService,
		FirestoneRemoteAchievementsLoaderService,
		AchievementsStorageService,
		AchievementsStateManagerService,

		CollectionManager,
		SetsManagerService,
		CollectionStorageService,
		HotkeyService,
		CardsHighlightService,
		CardsHighlightFacadeService,

		AppBootstrapService,
		BootstrapEssentialServicesService,
		BootstrapStoreServicesService,
		BootstrapOtherServicesService,
		AppStartupService,

		AdService,
		TipService,
		MainWindowStoreService,
		MainWindowStateFacadeService,
		StoreBootstrapService,
		LazyDataInitService,
		QuestsService,
		LiveStreamsService,
		SystemTrayService,

		HearthArenaAnalyticsService,

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
		HsClientConfigService,
		OutOfCardsService,
		GameNativeStateStoreService,
		TwitchPresenceService,
		TwitchCardsFacadeManagerService,
		TwitchLocalizationManagerService,

		CollectionBootstrapService,
		PackMonitor,
		PackStatsService,
		CardNotificationsService,

		AchievementsLiveProgressTrackingService,
		FirestoneAchievementsChallengeService,
		AchievementsMemoryMonitor,
		AchievementsNotificationService,
		FirestoneRemoteAchievementsLoaderService,

		DecktrackerStateLoaderService,
		DecksProviderService,
		ConstructedConfigService,
		ConstructedArchetypeServiceOrchestrator,

		EndGameListenerService,
		EndGameUploaderService,
		GameParserService,
		ReplayUploadService,
		SecretsParserService,
		GameStateParsersService,
		StatePostProcessService,
		DeckManipulationHelper,
		AttackOnBoardService,

		BattlegroundsStoreService,
		BgsPerfectGamesService,
		BgsGlobalStatsService,
		BgsRunStatsService,
		BgsBestUserStatsService,
		RealTimeStatsService,
		BgsCustomSimulationService,
		BgsOverlayHeroOverviewService,

		MercenariesMemoryCacheService,
		MercenariesStoreService,
		MercenariesOutOfCombatService,
		MercenariesReferenceDataService,
		MercenariesSynergiesHighlightService,

		AiDeckService,
		SecretConfigService,

		GameStatsUpdaterService,
		GameStatsProviderService,
		MatchStatsService,

		OverlayDisplayService,
		DeckCardService,
		DeckParserService,
		DeckParserFacadeService,
		ReviewIdService,
		GameStateService,
		DynamicZoneHelperService,
		ZoneOrderingService,
		GameStateMetaInfoService,

		ArenaLastMatchService,

		GlobalStatsService,
		GlobalStatsNotifierService,

		ReplaysNotificationService,
		RewardMonitorService,

		TavernBrawlService,
		MailsService,

		ProfileUploaderService,
		InternalProfileCollectionService,
		InternalProfileAchievementsService,
		InternalProfileBattlegroundsService,
		InternalProfileInfoService,

		LotteryService,
		LotteryWidgetControllerService,
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
		LotteryWindowComponent,

		DeckTrackerOverlayContainerComponent,
	],
})
export class LegacyFeatureShellModule {
	constructor(private readonly injector: Injector) {
		setAppInjector(injector);
	}
}
