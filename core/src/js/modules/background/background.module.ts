import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClientModule } from '@angular/common/http';
import {
	ApplicationRef,
	ComponentFactoryResolver,
	DoBootstrap,
	ErrorHandler,
	Injectable,
	NgModule,
	Type,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ColiseumComponentsModule } from '@firestone-hs/coliseum-components';
import { AllCardsService as RefCards } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { captureException, init, Integrations } from '@sentry/browser';
import { CaptureConsole, ExtraErrorData } from '@sentry/integrations';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { SimpleNotificationsModule } from 'angular2-notifications';
import { InlineSVGModule } from 'ng-inline-svg';
import { SelectModule } from 'ng-select';
import { ChartsModule } from 'ng2-charts';
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
import { BgsBattleSideComponent } from '../../components/battlegrounds/battles/bgs-battle-side.component';
import { BgsBattleComponent } from '../../components/battlegrounds/battles/bgs-battle.component';
import { BgsBattlesComponent } from '../../components/battlegrounds/battles/bgs-battles.component';
import { BgsHeroPortraitSimulatorComponent } from '../../components/battlegrounds/battles/bgs-hero-portrait-simulator.component';
import { BgsMinusButtonComponent } from '../../components/battlegrounds/battles/bgs-minus-button.component';
import { BgsPlusButtonComponent } from '../../components/battlegrounds/battles/bgs-plus-button.component';
import { BgsSimulatorHeroPowerSelectionComponent } from '../../components/battlegrounds/battles/bgs-simulator-hero-power-selection.component';
import { BgsSimulatorHeroSelectionComponent } from '../../components/battlegrounds/battles/bgs-simulator-hero-selection.component';
import { BgsSimulatorMinionSelectionComponent } from '../../components/battlegrounds/battles/bgs-simulator-minion-selection.component';
import { BattlegroundsSimulatorMinionTierFilterDropdownComponent } from '../../components/battlegrounds/battles/bgs-simulator-minion-tier-filter-dropdown.component';
import { BattlegroundsSimulatorMinionTribeFilterDropdownComponent } from '../../components/battlegrounds/battles/bgs-simulator-minion-tribe-filter-dropdown.component';
import { BgsBannedTribeComponent } from '../../components/battlegrounds/bgs-banned-tribe.component';
import { BgsBannedTribesComponent } from '../../components/battlegrounds/bgs-banned-tribes.component';
import { BgsCardTooltipComponent } from '../../components/battlegrounds/bgs-card-tooltip.component';
import { BattlegroundsCategoryDetailsComponent } from '../../components/battlegrounds/desktop/battlegrounds-category-details.component';
import { BattlegroundsDesktopComponent } from '../../components/battlegrounds/desktop/battlegrounds-desktop.component';
import { BattlegroundsPerfectGamesComponent } from '../../components/battlegrounds/desktop/categories/battlegrounds-perfect-games.component';
import { BattlegroundsPersonalStatsHeroDetailsComponent } from '../../components/battlegrounds/desktop/categories/battlegrounds-personal-stats-hero-details.component';
import { BattlegroundsPersonalStatsHeroesComponent } from '../../components/battlegrounds/desktop/categories/battlegrounds-personal-stats-heroes.component';
import { BattlegroundsPersonalStatsRatingComponent } from '../../components/battlegrounds/desktop/categories/battlegrounds-personal-stats-rating.component';
import { BattlegroundsPersonalStatsStatsComponent } from '../../components/battlegrounds/desktop/categories/battlegrounds-personal-stats-stats.component';
import { BattlegroundsSimulatorComponent } from '../../components/battlegrounds/desktop/categories/battlegrounds-simulator.component';
import { BattlegroundsStatsHeroVignetteComponent } from '../../components/battlegrounds/desktop/categories/battlegrounds-stats-hero-vignette.component';
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
import { BattlegroundsFiltersComponent } from '../../components/battlegrounds/desktop/filters/_battlegrounds-filters.component';
import { BattlegroundsHeroRecordsBrokenComponent } from '../../components/battlegrounds/desktop/secondary/battlegrounds-hero-records-broken.component';
import { BattlegroundsHeroesRecordsBrokenComponent } from '../../components/battlegrounds/desktop/secondary/battlegrounds-heroes-records-broken.component';
import { BattlegroundsReplaysRecapComponent } from '../../components/battlegrounds/desktop/secondary/battlegrounds-replays-recap.component';
import { BattlegroundsSimulatorDetailsEntityUpdateComponent } from '../../components/battlegrounds/desktop/secondary/battlegrounds-simulator-details-entity-update.component';
import { BattlegroundsSimulatorDetailsComponent } from '../../components/battlegrounds/desktop/secondary/battlegrounds-simulator-details.component';
import { BattlegroundsTierListComponent } from '../../components/battlegrounds/desktop/secondary/battlegrounds-tier-list.component';
import { GraphWithSingleValueComponent } from '../../components/battlegrounds/graph-with-single-value.component';
import { BgsHeroSelectionOverviewComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-selection-overview.component';
import { BgsHeroWarbandStatsComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-warband-stats.component';
import { BgsHeroFaceOffComponent } from '../../components/battlegrounds/in-game/bgs-hero-face-off.component';
import { BgsHeroFaceOffsComponent } from '../../components/battlegrounds/in-game/bgs-hero-face-offs.component';
import { BgsNextOpponentOverviewComponent } from '../../components/battlegrounds/in-game/bgs-next-opponent-overview.component';
import { BgsOpponentOverviewComponent } from '../../components/battlegrounds/in-game/bgs-opponent-overview.component';
import { MenuSelectionBgsComponent } from '../../components/battlegrounds/menu-selection-bgs.component';
import { BattlegroundsMinionsTiersOverlayComponent } from '../../components/battlegrounds/minions-tiers/battlegrounds-minions-tiers.component';
import { BattlegroundsMinionsGroupComponent } from '../../components/battlegrounds/minions-tiers/bgs-minions-group.component';
import { BattlegroundsMinionsListComponent } from '../../components/battlegrounds/minions-tiers/minions-list.component';
import { BattlegroundsMouseOverOverlayComponent } from '../../components/battlegrounds/overlay/battlegrounds-mouse-over-overlay.component';
import { BattlegroundsOverlayButtonComponent } from '../../components/battlegrounds/overlay/battlegrounds-overlay-button.component';
import { BgsHeroSelectionOverlayComponent } from '../../components/battlegrounds/overlay/bgs-hero-selection-overlay.component';
import { BgsTavernMinionComponent } from '../../components/battlegrounds/overlay/bgs-tavern-minion.component';
import { BgsSimulationOverlayComponent } from '../../components/battlegrounds/simulation-overlay/bgs-simulation-overlay.component';
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
import { ConstructedContentComponent } from '../../components/constructed/constructed-content.component';
import { ConstructedMenuSelectionComponent } from '../../components/constructed/constructed-menu-selection.component';
import { ConstructedComponent } from '../../components/constructed/constructed.component';
import { InGameAchievementRecapComponent } from '../../components/constructed/in-game-achievement-recap.component';
import { InGameAchievementsRecapComponent } from '../../components/constructed/in-game-achievements-recap.component';
import { InGameOpponentRecapComponent } from '../../components/constructed/in-game-opponent-recap.component';
import { DecktrackerComponent } from '../../components/decktracker/decktracker.component';
import { DeckManaCurveBarComponent } from '../../components/decktracker/main/deck-mana-curve-bar.component';
import { DeckManaCurveComponent } from '../../components/decktracker/main/deck-mana-curve.component';
import { DeckMatchupInfoComponent } from '../../components/decktracker/main/deck-matchup-info.component';
import { DeckWinrateMatrixComponent } from '../../components/decktracker/main/deck-winrate-matrix.component';
import { DecktrackerDeckDetailsComponent } from '../../components/decktracker/main/decktracker-deck-details.component';
import { DecktrackerDeckRecapComponent } from '../../components/decktracker/main/decktracker-deck-recap.component';
import { DecktrackerDeckSummaryComponent } from '../../components/decktracker/main/decktracker-deck-summary.component';
import { DecktrackerDecksComponent } from '../../components/decktracker/main/decktracker-decks.component';
import { DecktrackerLadderStatsComponent } from '../../components/decktracker/main/decktracker-ladder-stats.component';
import { DecktrackerPersonalStatsRankingComponent } from '../../components/decktracker/main/decktracker-personal-stats-ranking.component';
import { DecktrackerRatingGraphComponent } from '../../components/decktracker/main/decktracker-rating-graph.component';
import { DecktrackerReplaysRecapComponent } from '../../components/decktracker/main/decktracker-replays-recap.component';
import { DecktrackerStatsForReplaysComponent } from '../../components/decktracker/main/decktracker-stats-for-replays.component';
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
import { DuelsClassFilterDropdownComponent } from '../../components/duels/desktop/filters/duels-class-filter-dropdown.component';
import { DuelsDustFilterDropdownComponent } from '../../components/duels/desktop/filters/duels-dust-filter-dropdown.component';
import { DuelsGameModeFilterDropdownComponent } from '../../components/duels/desktop/filters/duels-game-mode-filter-dropdown.component';
import { DuelsHeroPowerFilterDropdownComponent } from '../../components/duels/desktop/filters/duels-hero-power-filter-dropdown.component';
import { DuelsHeroSortDropdownComponent } from '../../components/duels/desktop/filters/duels-hero-sort-dropdown.component';
import { DuelsLeaderboardGameModeFilterDropdownComponent } from '../../components/duels/desktop/filters/duels-leaderboard-game-mode-filter-dropdown.component';
import { DuelsMmrFilterDropdownComponent } from '../../components/duels/desktop/filters/duels-mmr-filter-dropdown.component';
import { DuelsSignatureTreasureFilterDropdownComponent } from '../../components/duels/desktop/filters/duels-signature-treasure-filter-dropdown.component';
import { DuelsStatTypeFilterDropdownComponent } from '../../components/duels/desktop/filters/duels-stat-type-filter-dropdown.component';
import { DuelsTimeFilterDropdownComponent } from '../../components/duels/desktop/filters/duels-time-filter-dropdown.component';
import { DuelsTreasurePassiveTypeFilterDropdownComponent } from '../../components/duels/desktop/filters/duels-treasure-passive-type-filter-dropdown.component';
import { DuelsTreasuresSortDropdownComponent } from '../../components/duels/desktop/filters/duels-treasures-sort-dropdown.component';
import { DuelsFiltersComponent } from '../../components/duels/desktop/filters/_duels-filters.component';
import { LootBundleComponent } from '../../components/duels/desktop/loot-bundle.component';
import { LootInfoComponent } from '../../components/duels/desktop/loot-info.component';
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
import { OpponentCardInfoIdComponent } from '../../components/matchoverlay/opponenthand/opponent-card-info-id.component';
import { OpponentCardInfoComponent } from '../../components/matchoverlay/opponenthand/opponent-card-info.component';
import { OpponentCardInfosComponent } from '../../components/matchoverlay/opponenthand/opponent-card-infos.component';
import { OpponentCardTurnNumberComponent } from '../../components/matchoverlay/opponenthand/opponent-card-turn-number.component';
import { OpponentHandOverlayComponent } from '../../components/matchoverlay/opponenthand/opponent-hand-overlay.component';
import { MenuSelectionComponent } from '../../components/menu-selection.component';
import { NotificationsComponent } from '../../components/notifications.component';
import { GameReplayComponent } from '../../components/replays/game-replay.component';
import { GroupedReplaysComponent } from '../../components/replays/grouped-replays.component';
import { MatchDetailsComponent } from '../../components/replays/match-details.component';
import { RankImageComponent } from '../../components/replays/rank-image.component';
import { ReplayInfoComponent } from '../../components/replays/replay-info.component';
import { ReplaysFilterComponent } from '../../components/replays/replays-filter.component';
import { ReplayIconToggleComponent } from '../../components/replays/replays-icon-toggle.component';
import { ReplaysListComponent } from '../../components/replays/replays-list.component';
import { ReplaysComponent } from '../../components/replays/replays.component';
import { SecretsHelperControlBarComponent } from '../../components/secrets-helper/secrets-helper-control-bar.component';
import { SecretsHelperWidgetIconComponent } from '../../components/secrets-helper/secrets-helper-widget-icon.component';
import { SecretsHelperComponent } from '../../components/secrets-helper/secrets-helper.component';
import { SettingsAchievementsLiveComponent } from '../../components/settings/achievements/settings-achievements-live.component';
import { SettingsAchievementsMenuComponent } from '../../components/settings/achievements/settings-achievements-menu.component';
import { SettingsAchievementsNotificationsComponent } from '../../components/settings/achievements/settings-achievements-notifications.component';
import { SettingsAchievementsSoundCaptureComponent } from '../../components/settings/achievements/settings-achievements-sound-capture.component';
import { SettingsAchievementsStorageComponent } from '../../components/settings/achievements/settings-achievements-storage.component';
import { SettingsAchievementsVideoCaptureComponent } from '../../components/settings/achievements/settings-achievements-video-capture.component';
import { SettingsAchievementsComponent } from '../../components/settings/achievements/settings-achievements.component';
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
import { SettingsDecktrackerYourDeckComponent } from '../../components/settings/decktracker/settings-decktracker-your-deck';
import { SettingsDecktrackerComponent } from '../../components/settings/decktracker/settings-decktracker.component';
import { SettingsGeneralBugReportComponent } from '../../components/settings/general/settings-general-bug-report.component';
import { SettingsGeneralLaunchComponent } from '../../components/settings/general/settings-general-launch.component';
import { SettingsGeneralMenuComponent } from '../../components/settings/general/settings-general-menu.component';
import { SettingsGeneralThirdPartyComponent } from '../../components/settings/general/settings-general-third-party.component';
import { SettingsGeneralComponent } from '../../components/settings/general/settings-general.component';
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
import { OutOfCardsCallbackComponent } from '../../components/third-party/out-of-cards-callback.component';
import { TwitchAuthCallbackComponent } from '../../components/twitch-auth/twitch-auth-callback.component';
import { AchievementsManager } from '../../services/achievement/achievements-manager.service';
import { AchievementsMonitor } from '../../services/achievement/achievements-monitor.service';
import { AchievementsNotificationService } from '../../services/achievement/achievements-notification.service';
import { RemoteAchievementsService } from '../../services/achievement/remote-achievements.service';
import { TemporaryResolutionOverrideService } from '../../services/achievement/temporary-resolution-override-service';
import { AdService } from '../../services/ad.service';
import { ApiRunner } from '../../services/api-runner';
import { AppBootstrapService } from '../../services/app-bootstrap.service';
import { ArenaStateBuilderService } from '../../services/arena/arena-state-builder.service';
import { BgsBattleSimulationService } from '../../services/battlegrounds/bgs-battle-simulation.service';
import { BgsBestUserStatsService } from '../../services/battlegrounds/bgs-best-user-stats.service';
import { BgsBuilderService } from '../../services/battlegrounds/bgs-builder.service';
import { BgsCustomSimulationService } from '../../services/battlegrounds/bgs-custom-simulation-service.service';
import { BgsGlobalStatsService } from '../../services/battlegrounds/bgs-global-stats.service';
import { BgsInitService } from '../../services/battlegrounds/bgs-init.service';
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
import { DeckCardService } from '../../services/decktracker/deck-card.service';
import { DeckParserService } from '../../services/decktracker/deck-parser.service';
import { DungeonLootParserService } from '../../services/decktracker/dungeon-loot-parser.service';
import { DynamicZoneHelperService } from '../../services/decktracker/dynamic-zone-helper.service';
import { DeckManipulationHelper } from '../../services/decktracker/event-parser/deck-manipulation-helper';
import { SecretsParserService } from '../../services/decktracker/event-parser/secrets/secrets-parser.service';
import { GameStateMetaInfoService } from '../../services/decktracker/game-state-meta-info.service';
import { GameStateService } from '../../services/decktracker/game-state.service';
import { DecksStateBuilderService } from '../../services/decktracker/main/decks-state-builder.service';
import { DecktrackerStateLoaderService } from '../../services/decktracker/main/decktracker-state-loader.service';
import { ReplaysStateBuilderService } from '../../services/decktracker/main/replays-state-builder.service';
import { OverlayDisplayService } from '../../services/decktracker/overlay-display.service';
import { SecretConfigService } from '../../services/decktracker/secret-config.service';
import { ZoneOrderingService } from '../../services/decktracker/zone-ordering.service';
import { DevService } from '../../services/dev.service';
import { DuelsStateBuilderService } from '../../services/duels/duels-state-builder.service';
import { GameEventsEmitterService } from '../../services/game-events-emitter.service';
import { GameEvents } from '../../services/game-events.service';
import { GlobalStatsNotifierService } from '../../services/global-stats/global-stats-notifier.service';
import { GlobalStatsService } from '../../services/global-stats/global-stats.service';
import { LogListenerService } from '../../services/log-listener.service';
import { LogRegisterService } from '../../services/log-register.service';
import { LogsUploaderService } from '../../services/logs-uploader.service';
import { OutOfCardsService } from '../../services/mainwindow/out-of-cards.service';
import { CollaboratorsService } from '../../services/mainwindow/store/collaborators.service';
import { CollectionBootstrapService } from '../../services/mainwindow/store/collection-bootstrap.service';
import { AchievementUpdateHelper } from '../../services/mainwindow/store/helper/achievement-update-helper';
import { MainWindowStoreService } from '../../services/mainwindow/store/main-window-store.service';
import { StoreBootstrapService } from '../../services/mainwindow/store/store-bootstrap.service';
import { TwitchAuthService } from '../../services/mainwindow/twitch-auth.service';
import { EndGameListenerService } from '../../services/manastorm-bridge/end-game-listener.service';
import { EndGameUploaderService } from '../../services/manastorm-bridge/end-game-uploader.service';
import { GameParserService } from '../../services/manastorm-bridge/game-parser.service';
import { ReplayUploadService } from '../../services/manastorm-bridge/replay-upload.service';
import { OwNotificationsService } from '../../services/notifications.service';
import { PatchesConfigService } from '../../services/patches-config.service';
import { PlayersInfoService } from '../../services/players-info.service';
import { GameEventsPluginService } from '../../services/plugins/game-events-plugin.service';
import { SimpleIOService } from '../../services/plugins/simple-io.service';
import { RealTimeNotificationService } from '../../services/real-time-notifications.service';
import { ReplaysNotificationService } from '../../services/replays/replays-notification.service';
import { RewardMonitorService } from '../../services/rewards/rewards-monitor';
import { S3FileUploadService } from '../../services/s3-file-upload.service';
import { SettingsCommunicationService } from '../../services/settings/settings-communication.service';
import { GameStatsLoaderService } from '../../services/stats/game/game-stats-loader.service';
import { GameStatsUpdaterService } from '../../services/stats/game/game-stats-updater.service';
import { StatsStateBuilderService } from '../../services/stats/stats-state-builder.service';
import { AppUiStoreService } from '../../services/ui-store/app-ui-store.service';
import { UserService } from '../../services/user.service';
import { SharedDeckTrackerModule } from '../shared-decktracker/shared-dectracker.module';
import { SharedServicesModule } from '../shared-services/shared-services.module';
import { SharedModule } from '../shared/shared.module';

console.log('version is ' + process.env.APP_VERSION);
console.log('environment is ' + process.env.NODE_ENV);
console.log('is local test? ' + process.env.LOCAL_TEST);

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

if (process.env.LOCAL_TEST) {
	console.error('LOCAL_TEST is true, this should never happen in prod');
}

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
	handleError(error) {
		captureException(error.originalError || error);
		throw error;
	}
}

const components = [
	AppComponent,
	MainWindowComponent,
	LoadingComponent,
	NotificationsComponent,
	BattlegroundsComponent,
	BattlegroundsMouseOverOverlayComponent,
	BattlegroundsMinionsTiersOverlayComponent,
	BattlegroundsOverlayButtonComponent,
	BgsBannedTribesComponent,
	BgsSimulationOverlayComponent,
	BgsHeroSelectionOverlayComponent,
	ConstructedComponent,
	DeckTrackerOverlayPlayerComponent,
	DeckTrackerOverlayOpponentComponent,
	GameCountersComponent,
	OpponentHandOverlayComponent,
	OutOfCardsCallbackComponent,
	SecretsHelperComponent,
	TwitchAuthCallbackComponent,
	SettingsComponent,
];

@NgModule({
	imports: [
		BrowserModule,
		HttpClientModule,
		BrowserAnimationsModule,
		DragDropModule,
		SharedServicesModule.forRoot(),
		InlineSVGModule.forRoot(),
		SelectModule,
		FormsModule,
		ReactiveFormsModule,
		SharedModule,
		ChartsModule,
		NgxChartsModule,
		SimpleNotificationsModule.forRoot(),
		OverlayModule,
		ColiseumComponentsModule,
		SharedDeckTrackerModule,
	],
	declarations: [
		...components,

		GlobalHeaderComponent,

		BattlegroundsContentComponent,
		BgsHeroSelectionOverviewComponent,
		BgsHeroWarbandStatsComponent,
		BgsNextOpponentOverviewComponent,
		BgsHeroFaceOffComponent,
		BgsOpponentOverviewComponent,
		MenuSelectionBgsComponent,
		BgsHeroFaceOffsComponent,
		BgsTavernMinionComponent,
		BattlegroundsMinionsListComponent,
		BattlegroundsMinionsGroupComponent,
		BgsBannedTribeComponent,
		GraphWithSingleValueComponent,
		BgsBattlesComponent,
		BgsBattleComponent,
		BgsBattleSideComponent,
		BgsHeroPortraitSimulatorComponent,
		BgsPlusButtonComponent,
		BgsMinusButtonComponent,
		BgsSimulatorHeroSelectionComponent,
		BgsSimulatorHeroPowerSelectionComponent,
		BgsSimulatorMinionSelectionComponent,
		BattlegroundsSimulatorMinionTribeFilterDropdownComponent,
		BattlegroundsSimulatorMinionTierFilterDropdownComponent,

		ConstructedComponent,
		ConstructedContentComponent,
		InGameAchievementsRecapComponent,
		InGameAchievementRecapComponent,
		InGameOpponentRecapComponent,
		ConstructedMenuSelectionComponent,

		GenericCountersComponent,

		OpponentHandOverlayComponent,
		OpponentCardInfosComponent,
		OpponentCardInfoComponent,
		OpponentCardInfoIdComponent,
		OpponentCardTurnNumberComponent,

		SecretsHelperControlBarComponent,
		SecretsHelperComponent,
		SecretsHelperWidgetIconComponent,

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
		SetsContainerComponent,
		CardBacksComponent,
		CardBackComponent,
		FullCardBackComponent,
		HeroPortraitsComponent,
		HeroPortraitComponent,
		TheCoinsComponent,
		OwnedFilterComponent,
		CollectionPackStatsComponent,
		PackHistoryComponent,
		PackHistoryItemComponent,
		PackDisplayComponent,

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
		DecktrackerDeckDetailsComponent,
		DeckWinrateMatrixComponent,
		DeckMatchupInfoComponent,
		DecktrackerDeckRecapComponent,
		DeckManaCurveComponent,
		DeckManaCurveBarComponent,
		DecktrackerReplaysRecapComponent,
		DecktrackerPersonalStatsRankingComponent,
		DecktrackerLadderStatsComponent,
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

		ReplaysComponent,
		ReplaysListComponent,
		ReplaysFilterComponent,
		GroupedReplaysComponent,
		ReplayInfoComponent,
		MatchDetailsComponent,
		GameReplayComponent,
		RankImageComponent,
		ReplayIconToggleComponent,

		BattlegroundsDesktopComponent,
		BattlegroundsCategoryDetailsComponent,
		BattlegroundsPersonalStatsHeroesComponent,
		BattlegroundsStatsHeroVignetteComponent,
		BattlegroundsPersonalStatsRatingComponent,
		BattlegroundsPerfectGamesComponent,
		BattlegroundsSimulatorComponent,
		BattlegroundsSimulatorDetailsComponent,
		BattlegroundsSimulatorDetailsEntityUpdateComponent,
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
		BattlegroundsFiltersComponent,
		BattlegroundsHeroSortDropdownComponent,
		BattlegroundsHeroFilterDropdownComponent,
		BattlegroundsRankFilterDropdownComponent,
		BattlegroundsRankGroupDropdownComponent,
		BattlegroundsTimeFilterDropdownComponent,

		DuelsDesktopComponent,
		DuelsEmptyStateComponent,
		DuelsRunsListComponent,
		DuelsRunComponent,
		LootInfoComponent,
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
		DuelsFiltersComponent,
		DuelsGameModeFilterDropdownComponent,
		DuelsTreasuresSortDropdownComponent,
		DuelsStatTypeFilterDropdownComponent,
		DuelsTreasurePassiveTypeFilterDropdownComponent,
		DuelsHeroSortDropdownComponent,
		DuelsTimeFilterDropdownComponent,
		DuelsClassFilterDropdownComponent,
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

		StatsDesktopComponent,
		StatsXpGraphComponent,
		StatsFiltersComponent,
		StatsXpSeasonFilterDropdownComponent,

		FtueComponent,
		NewVersionNotificationComponent,

		SettingsAppSelectionComponent,
		SettingsAdvancedToggleComponent,

		SettingsGeneralComponent,
		SettingsGeneralMenuComponent,
		SettingsGeneralLaunchComponent,
		SettingsGeneralBugReportComponent,
		SettingsGeneralThirdPartyComponent,

		SettingsCollectionComponent,
		SettingsCollectionMenuComponent,
		SettingsCollectionNotificationComponent,

		SettingsAchievementsComponent,
		SettingsAchievementsMenuComponent,
		SettingsAchievementsVideoCaptureComponent,
		SettingsAchievementsSoundCaptureComponent,
		SettingsAchievementsStorageComponent,
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

		SettingsReplaysComponent,
		SettingsReplaysGeneralComponent,
		SettingsReplaysMenuComponent,

		SettingsBattlegroundsComponent,
		SettingsBattlegroundsGeneralComponent,
		SettingsBattlegroundsMenuComponent,

		PreferenceSliderComponent,

		AdvancedSettingDirective,
	],
	entryComponents: [
		BgsCardTooltipComponent,
		TwitchBgsHeroOverviewComponent,
		BgsSimulatorHeroSelectionComponent,
		BgsSimulatorMinionSelectionComponent,
		BgsSimulatorHeroPowerSelectionComponent,
		...components,
	],
	providers: [
		{ provide: ErrorHandler, useClass: SentryErrorHandler },
		AppBootstrapService,
		RealTimeNotificationService,
		AdService,
		MainWindowStoreService,
		StoreBootstrapService,
		CollaboratorsService,
		UserService,
		ApiRunner,

		AppUiStoreService,
		CardsInitService,
		CardsFacadeService,
		RefCards,
		// For coliseum-components
		{ provide: AllCardsService, useClass: CardsFacadeService },

		DevService,
		GameEvents,
		GameEventsEmitterService,
		GameEventsPluginService,
		LogListenerService,
		CardsMonitorService,
		LogRegisterService,
		SettingsCommunicationService,
		TwitchAuthService,
		OutOfCardsService,
		PlayersInfoService,

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
		DecksStateBuilderService,
		ReplaysStateBuilderService,

		EndGameListenerService,
		EndGameUploaderService,
		GameParserService,
		ReplayUploadService,
		SecretsParserService,
		GameStateService,
		DeckManipulationHelper,

		BattlegroundsStoreService,
		BgsInitService,
		BgsBuilderService,
		BgsGlobalStatsService,
		BgsBattleSimulationService,
		BgsRunStatsService,
		BgsBestUserStatsService,
		RealTimeStatsService,
		BgsCustomSimulationService,

		AiDeckService,
		SecretConfigService,
		PatchesConfigService,

		GameStatsLoaderService,
		GameStatsUpdaterService,

		OverlayDisplayService,
		DeckCardService,
		DeckParserService,
		DungeonLootParserService,
		ArenaRunParserService,
		GameStateService,
		DynamicZoneHelperService,
		ZoneOrderingService,
		GameStateMetaInfoService,

		DuelsStateBuilderService,

		ArenaStateBuilderService,

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
	constructor(private resolver: ComponentFactoryResolver) {}

	ngDoBootstrap(appRef: ApplicationRef) {
		components.forEach((componentDef: Type<any>) => {
			const factory = this.resolver.resolveComponentFactory(componentDef);
			if (document.querySelector(factory.selector)) {
				appRef.bootstrap(factory);
			}
		});
	}
}
