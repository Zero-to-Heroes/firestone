import { EventEmitter, Injectable } from '@angular/core';
import { DuelsMetaHeroStatsAccessService } from '@firestone/duels/data-access';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { TranslateService } from '@ngx-translate/core';
import { DuelsMemoryCacheService } from '@services/duels/duels-memory-cache.service';
import { LocalizationService } from '@services/localization.service';
import { DuelsBuildDeckEvent } from '@services/mainwindow/store/events/duels/duels-build-deck-event';
import { DuelsChoosingHeroEvent } from '@services/mainwindow/store/events/duels/duels-choosing-hero-event';
import { DuelsCurrentDeckEvent } from '@services/mainwindow/store/events/duels/duels-current-deck-event';
import { DuelsCurrentOptionEvent } from '@services/mainwindow/store/events/duels/duels-current-option-event';
import { DuelsDeckbuilderGoBackEvent } from '@services/mainwindow/store/events/duels/duels-deckbuilder-go-back-event';
import { DuelsDeckbuilderHeroPowerSelectedEvent } from '@services/mainwindow/store/events/duels/duels-deckbuilder-hero-power-selected-decks-event';
import { DuelsDeckbuilderHeroSelectedEvent } from '@services/mainwindow/store/events/duels/duels-deckbuilder-hero-selected-decks-event';
import { DuelsDeckbuilderSaveDeckEvent } from '@services/mainwindow/store/events/duels/duels-deckbuilder-save-deck-event';
import { DuelsDeckbuilderSignatureTreasureSelectedEvent } from '@services/mainwindow/store/events/duels/duels-deckbuilder-signature-treasure-selected-decks-event';
import { DuelsDeletePersonalDeckSummaryEvent } from '@services/mainwindow/store/events/duels/duels-delete-personal-deck-summary-event';
import { DuelsExploreDecksEvent } from '@services/mainwindow/store/events/duels/duels-explore-decks-event';
import { DuelsIsOnDeckBuildingLobbyScreenEvent } from '@services/mainwindow/store/events/duels/duels-is-on-deck-building-lobby-screen-event';
import { DuelsIsOnMainScreenEvent } from '@services/mainwindow/store/events/duels/duels-is-on-main-screen-event';
import { DuelsStateUpdatedEvent } from '@services/mainwindow/store/events/duels/duels-state-updated-event';
import { DuelsBuildDeckParser } from '@services/mainwindow/store/processors/duels/duels-build-deck-parser';
import { DuelsChoosingHeroParser } from '@services/mainwindow/store/processors/duels/duels-choosing-hero-parser';
import { DuelsCurrentDeckProcessor } from '@services/mainwindow/store/processors/duels/duels-current-deck-processor';
import { DuelsCurrentOptionParser } from '@services/mainwindow/store/processors/duels/duels-current-option-parser';
import { DuelsDeckbuilderGoBackProcessor } from '@services/mainwindow/store/processors/duels/duels-deckbuilder-go-back-parser';
import { DuelsDeckbuilderHeroPowerSelectedProcessor } from '@services/mainwindow/store/processors/duels/duels-deckbuilder-hero-power-selected-parser';
import { DuelsDeckbuilderHeroSelectedProcessor } from '@services/mainwindow/store/processors/duels/duels-deckbuilder-hero-selected-parser';
import { DuelsDeckbuilderSaveDeckProcessor } from '@services/mainwindow/store/processors/duels/duels-deckbuilder-save-deck-processor';
import { DuelsDeckbuilderSignatureTreasureSelectedProcessor } from '@services/mainwindow/store/processors/duels/duels-deckbuilder-signature-treasure-selected-parser';
import { DuelsDeletePersonalDeckSummaryProcessor } from '@services/mainwindow/store/processors/duels/duels-delete-personal-deck-summary-processor';
import { DuelsExploreDecksParser } from '@services/mainwindow/store/processors/duels/duels-explore-decks-parser';
import { DuelsIsOnDeckBuildingLobbyScreenProcessor } from '@services/mainwindow/store/processors/duels/duels-is-on-deck-building-lobby-screen-processor';
import { DuelsIsOnMainScreenProcessor } from '@services/mainwindow/store/processors/duels/duels-is-on-main-screen-processor';
import { DuelsStateUpdatedProcessor } from '@services/mainwindow/store/processors/duels/duels-state-updated-processor';
import { Map } from 'immutable';
import { BehaviorSubject } from 'rxjs';
import { MailboxMarkMessageReadEvent } from '../../../../libs/mails/services/mailbox-mark-message-read-event';
import { MailboxMarkMessageReadProcessor } from '../../../../libs/mails/services/mailbox-mark-message-read-processor';
import { PackStatsService } from '../../../../libs/packs/services/pack-stats.service';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';
import { MemoryUpdate } from '../../../models/memory/memory-update';
import { AchievementHistoryStorageService } from '../../achievement/achievement-history-storage.service';
import { AchievementsRepository } from '../../achievement/achievements-repository.service';
import { AchievementsLoaderService } from '../../achievement/data/achievements-loader.service';
import { RemoteAchievementsService } from '../../achievement/remote-achievements.service';
import { BgsGlobalStatsService } from '../../battlegrounds/bgs-global-stats.service';
import { BgsRunStatsService } from '../../battlegrounds/bgs-run-stats.service';
import { CardHistoryStorageService } from '../../collection/card-history-storage.service';
import { CollectionManager } from '../../collection/collection-manager.service';
import { CollectionStorageService } from '../../collection/collection-storage.service';
import { SetsService } from '../../collection/sets-service.service';
import { DecksProviderService } from '../../decktracker/main/decks-provider.service';
import { DecktrackerStateLoaderService } from '../../decktracker/main/decktracker-state-loader.service';
import { ReplaysStateBuilderService } from '../../decktracker/main/replays-state-builder.service';
import { DuelsDecksProviderService } from '../../duels/duels-decks-provider.service';
import { DuelsStateBuilderService } from '../../duels/duels-state-builder.service';
import { Events } from '../../events.service';
import { MercenariesMemoryCacheService } from '../../mercenaries/mercenaries-memory-cache.service';
import { OwNotificationsService } from '../../notifications.service';
import { MemoryInspectionService } from '../../plugins/memory-inspection.service';
import { PreferencesService } from '../../preferences.service';
import { ProcessingQueue } from '../../processing-queue.service';
import { GameStatsLoaderService } from '../../stats/game/game-stats-loader.service';
import { GameStatsUpdaterService } from '../../stats/game/game-stats-updater.service';
import { UserService } from '../../user.service';
import { LiveStreamsService } from '../live-streams.service';
import { AchievementCompletedEvent } from './events/achievements/achievement-completed-event';
import { AchievementHistoryCreatedEvent } from './events/achievements/achievement-history-created-event';
import { AchievementsFullRefreshEvent } from './events/achievements/achievements-full-refresh-event';
import { AchievementsFullUpdatedEvent } from './events/achievements/achievements-full-updated-event';
import { AchievementsInitEvent } from './events/achievements/achievements-init-event';
import { AchievementsUpdatedEvent } from './events/achievements/achievements-updated-event';
import { ChangeVisibleAchievementEvent } from './events/achievements/change-visible-achievement-event';
import { FilterShownAchievementsEvent } from './events/achievements/filter-shown-achievements-event';
import { SelectAchievementCategoryEvent } from './events/achievements/select-achievement-category-event';
import { ShowAchievementDetailsEvent } from './events/achievements/show-achievement-details-event';
import { ArenaClassFilterSelectedEvent } from './events/arena/arena-class-filter-selected-event';
import { ArenaRewardsUpdatedEvent } from './events/arena/arena-rewards-updated-event';
import { ArenaTimeFilterSelectedEvent } from './events/arena/arena-time-filter-selected-event';
import { BattlegroundsMainWindowSelectBattleEvent } from './events/battlegrounds/battlegrounds-main-window-select-battle-event';
import { BgsBestStatsLoadedEvent } from './events/battlegrounds/bgs-best-stats-loaded-event';
import { BgsHeroFilterSelectedEvent } from './events/battlegrounds/bgs-hero-filter-selected-event';
import { BgsHeroSortFilterSelectedEvent } from './events/battlegrounds/bgs-hero-sort-filter-selected-event';
import { BattlegroundsMetaHeroStatsLoadedEvent } from './events/battlegrounds/bgs-meta-hero-stats-loaded-event';
import { BattlegroundsMetaHeroStrategiesLoadedEvent } from './events/battlegrounds/bgs-meta-hero-strategies-loaded-event';
import { BgsMmrGroupFilterSelectedEvent } from './events/battlegrounds/bgs-mmr-group-filter-selected-event';
import { BattlegroundsPerfectGamesLoadedEvent } from './events/battlegrounds/bgs-perfect-games-loaded-event';
import { BgsPersonalStatsSelectHeroDetailsEvent } from './events/battlegrounds/bgs-personal-stats-select-hero-details-event';
import { BgsPersonalStatsSelectHeroDetailsWithRemoteInfoEvent } from './events/battlegrounds/bgs-personal-stats-select-hero-details-with-remote-info-event';
import { BgsPostMatchStatsComputedEvent } from './events/battlegrounds/bgs-post-match-stats-computed-event';
import { BgsQuestsDataLoadedEvent } from './events/battlegrounds/bgs-quests-data-loaded-event';
import { BgsRankFilterSelectedEvent } from './events/battlegrounds/bgs-rank-filter-selected-event';
import { BgsRequestNewGlobalStatsLoadEvent } from './events/battlegrounds/bgs-request-new-global-stats-load-event';
import { BgsShowStrategiesEvent } from './events/battlegrounds/bgs-show-strategies-event';
import { BgsTimeFilterSelectedEvent } from './events/battlegrounds/bgs-time-filter-selected-event';
import { BgsTribesFilterSelectedEvent } from './events/battlegrounds/bgs-tribes-filter-selected-event';
import { SelectBattlegroundsCategoryEvent } from './events/battlegrounds/select-battlegrounds-category-event';
import { SelectBattlegroundsPersonalStatsHeroTabEvent } from './events/battlegrounds/select-battlegrounds-personal-stats-hero-event';
import { BgsCustomSimulationResetEvent } from './events/battlegrounds/simulator/bgs-custom-simulation-reset-event';
import { BgsCustomSimulationUpdateEvent } from './events/battlegrounds/simulator/bgs-custom-simulation-update-event';
import { BgsSimulatorMinionTierFilterSelectedEvent } from './events/battlegrounds/simulator/bgs-simulator-minion-tier-filter-selected-event';
import { BgsSimulatorMinionTribeFilterSelectedEvent } from './events/battlegrounds/simulator/bgs-simulator-minion-tribe-filter-selected-event';
import { ChangeVisibleApplicationEvent } from './events/change-visible-application-event';
import { CloseMainWindowEvent } from './events/close-main-window-event';
import { CollectionPacksUpdatedEvent } from './events/collection/colection-packs-updated-event';
import { CollectionRefreshPacksEvent } from './events/collection/colection-refresh-packs-event';
import { CollectionInitEvent } from './events/collection/collection-init-event';
import { CollectionSelectCurrentTabEvent } from './events/collection/collection-select-current-tab-event';
import { LoadMoreCardHistoryEvent } from './events/collection/load-more-card-history-event';
import { NewCardEvent } from './events/collection/new-card-event';
import { NewPackEvent } from './events/collection/new-pack-event';
import { SearchCardsEvent } from './events/collection/search-cards-event';
import { SelectCollectionSetEvent } from './events/collection/select-collection-set-event';
import { ShowCardBackDetailsEvent } from './events/collection/show-card-back-details-event';
import { ShowCardDetailsEvent } from './events/collection/show-card-details-event';
import { UpdateCardSearchResultsEvent } from './events/collection/update-card-search-results-event';
import { CurrentUserEvent } from './events/current-user-event';
import { ChangeDeckFormatFilterEvent } from './events/decktracker/change-deck-format-filter-event';
import { ChangeDeckModeFilterEvent } from './events/decktracker/change-deck-mode-filter-event';
import { ChangeDeckRankCategoryFilterEvent } from './events/decktracker/change-deck-rank-category-filter-event';
import { ChangeDeckRankFilterEvent } from './events/decktracker/change-deck-rank-filter-event';
import { ChangeDeckRankGroupEvent } from './events/decktracker/change-deck-rank-group-event';
import { ChangeDeckSortEvent } from './events/decktracker/change-deck-sort-event';
import { ChangeDeckTimeFilterEvent } from './events/decktracker/change-deck-time-filter-event';
import { ConstructedDeckbuilderClassSelectedEvent } from './events/decktracker/constructed-deckbuilder-class-selected-event';
import { ConstructedDeckbuilderFormatSelectedEvent } from './events/decktracker/constructed-deckbuilder-format-selected-event';
import { ConstructedDeckbuilderGoBackEvent } from './events/decktracker/constructed-deckbuilder-go-back-event';
import { ConstructedDeckbuilderImportDeckEvent } from './events/decktracker/constructed-deckbuilder-import-deck-event';
import { ConstructedDeckbuilderSaveDeckEvent } from './events/decktracker/constructed-deckbuilder-save-deck-event';
import { ConstructedEjectDeckVersionEvent } from './events/decktracker/constructed-eject-deck-version-event';
import { ConstructedMetaDecksLoadedEvent } from './events/decktracker/constructed-meta-decks-loaded-event';
import { ConstructedNewDeckVersionEvent } from './events/decktracker/constructed-new-deck-version-event';
import { ConstructedToggleDeckVersionStatsEvent } from './events/decktracker/constructed-toggle-deck-version-stats-event';
import { DecktrackerDeleteDeckEvent } from './events/decktracker/decktracker-delete-deck-event';
import { DecktrackerResetDeckStatsEvent } from './events/decktracker/decktracker-reset-deck-stats-event';
import { HideDeckSummaryEvent } from './events/decktracker/hide-deck-summary-event';
import { RestoreDeckSummaryEvent } from './events/decktracker/restore-deck-summary-event';
import { SelectDeckDetailsEvent } from './events/decktracker/select-deck-details-event';
import { SelectDecksViewEvent } from './events/decktracker/select-decks-view-event';
import { ToggleShowHiddenDecksEvent } from './events/decktracker/toggle-show-hidden-decks-event';
import { DuelsDeckbuilderImportDeckEvent } from './events/duels/duels-deckbuilder-import-deck-event';
import { DuelsDecksSearchEvent } from './events/duels/duels-decks-search-event';
import { DuelsGameModeFilterSelectedEvent } from './events/duels/duels-game-mode-filter-selected-event';
import { DuelsHeroPowerFilterSelectedEvent } from './events/duels/duels-hero-power-filter-selected-event';
import { DuelsHeroSearchEvent } from './events/duels/duels-hero-search-event';
import { DuelsHeroSortFilterSelectedEvent } from './events/duels/duels-hero-sort-filter-selected-event';
import { DuelsHidePersonalDeckSummaryEvent } from './events/duels/duels-hide-personal-deck-summary-event';
import { DuelsLeaderboardGameModeFilterSelectedEvent } from './events/duels/duels-leaderboard-game-mode-filter-selected-event';
import { DuelsMmrFilterSelectedEvent } from './events/duels/duels-mmr-filter-selected-event';
import { DuelsPassivesFilterSelectedEvent } from './events/duels/duels-passives-filter-selected-event';
import { DuelsPersonalDeckRenameEvent } from './events/duels/duels-personal-deck-rename-event';
import { DuelsRequestNewGlobalStatsLoadEvent } from './events/duels/duels-request-new-global-stats-load-event';
import { DuelsRestorePersonalDeckSummaryEvent } from './events/duels/duels-restore-personal-deck-summary-event';
import { DuelsSelectCategoryEvent } from './events/duels/duels-select-category-event';
import { DuelsSignatureTreasureFilterSelectedEvent } from './events/duels/duels-signature-treasure-filter-selected-event';
import { DuelsStatTypeFilterSelectedEvent } from './events/duels/duels-stat-type-filter-selected-event';
import { DuelsTimeFilterSelectedEvent } from './events/duels/duels-time-filter-selected-event';
import { DuelsToggleExpandedRunEvent } from './events/duels/duels-toggle-expanded-run-event';
import { DuelsToggleShowHiddenPersonalDecksEvent } from './events/duels/duels-toggle-show-hidden-personal-decks-event';
import { DuelsTopDeckRunDetailsLoadedEvent } from './events/duels/duels-top-deck-run-details-loaded-event';
import { DuelsTopDecksHeroFilterSelectedEvent } from './events/duels/duels-top-decks-class-filter-selected-event';
import { DuelsTopDecksDustFilterSelectedEvent } from './events/duels/duels-top-decks-dust-filter-selected-event';
import { DuelsTopDecksUpdateEvent } from './events/duels/duels-top-decks-event';
import { DuelsTreasurePassiveTypeFilterSelectedEvent } from './events/duels/duels-treasure-passive-type-filter-selected-event';
import { DuelsTreasureSearchEvent } from './events/duels/duels-treasure-search-event';
import { DuelsTreasureSortFilterSelectedEvent } from './events/duels/duels-treasure-sort-filter-selected-event';
import { DuelsViewDeckDetailsEvent } from './events/duels/duels-view-deck-details-event';
import { DuelsViewPersonalDeckDetailsEvent } from './events/duels/duels-view-personal-deck-details-event';
import { DungeonLootInfoUpdatedEvent } from './events/duels/dungeon-loot-info-updated-event';
import { NextFtueEvent } from './events/ftue/next-ftue-event';
import { PreviousFtueEvent } from './events/ftue/previous-ftue-event';
import { SkipFtueEvent } from './events/ftue/skip-ftue-event';
import { GenericPreferencesUpdateEvent } from './events/generic-preferences-update-event';
import { LocalizationUpdateEvent } from './events/localization-update-event';
import { MainWindowStoreEvent } from './events/main-window-store-event';
import { MercenariesAddMercToBackupTeamEvent } from './events/mercenaries/mercenaries-add-merc-to-backup-team-event';
import { MercenariesCollectionInformationFromMemoryEvent } from './events/mercenaries/mercenaries-collection-information-from-memory-event';
import { MercenariesGlobalStatsLoadedEvent } from './events/mercenaries/mercenaries-global-stats-loaded-event';
import { MercenariesHeroLevelFilterSelectedEvent } from './events/mercenaries/mercenaries-hero-level-filter-selected-event';
import { MercenariesHeroSearchEvent } from './events/mercenaries/mercenaries-hero-search-event';
import { MercenariesHeroSelectedEvent } from './events/mercenaries/mercenaries-hero-selected-event';
import { MercenariesHideTeamSummaryEvent } from './events/mercenaries/mercenaries-hide-team-summary-event';
import { MercenariesMapInformationFromMemoryEvent } from './events/mercenaries/mercenaries-map-information-from-memory-event';
import { MercenariesModeFilterSelectedEvent } from './events/mercenaries/mercenaries-mode-filter-selected-event';
import { MercenariesPersonalHeroesSortEvent } from './events/mercenaries/mercenaries-personal-heroes-sort-event';
import { MercenariesPveDifficultyFilterSelectedEvent } from './events/mercenaries/mercenaries-pve-difficulty-filter-selected-event';
import { MercenariesPvpMmrFilterSelectedEvent } from './events/mercenaries/mercenaries-pvp-mmr-filter-selected-event';
import { MercenariesReferenceDataLoadedEvent } from './events/mercenaries/mercenaries-reference-data-loaded-event';
import { MercenariesRemoveMercToBackupTeamEvent } from './events/mercenaries/mercenaries-remove-merc-to-backup-team-event';
import { MercenariesRestoreTeamSummaryEvent } from './events/mercenaries/mercenaries-restore-team-summary-event';
import { MercenariesRoleFilterSelectedEvent } from './events/mercenaries/mercenaries-role-filter-selected-event';
import { MercenariesSelectCategoryEvent } from './events/mercenaries/mercenaries-select-category-event';
import { MercenariesSelectCompositionEvent } from './events/mercenaries/mercenaries-select-composition-event';
import { MercenariesStarterFilterSelectedEvent } from './events/mercenaries/mercenaries-starter-filter-selected-event';
import { MercenariesToggleShowHiddenTeamsEvent } from './events/mercenaries/mercenaries-toggle-show-hidden-teams-event';
import { MercenariesViewMercDetailsEvent } from './events/mercenaries/mercenaries-view-merc-details-event';
import { NavigationBackEvent } from './events/navigation/navigation-back-event';
import { NavigationNextEvent } from './events/navigation/navigation-next-event';
import { ActiveQuestsUpdatedEvent } from './events/quests/active-quests-updated-event';
import { ReferenceQuestsLoadedEvent } from './events/quests/reference-quests-loaded-event';
import { ChangeMatchStatsNumberOfTabsEvent } from './events/replays/change-match-stats-number-of-tabs-event';
import { SelectMatchStatsTabEvent } from './events/replays/select-match-stats-tab-event';
import { ShowMatchStatsEvent } from './events/replays/show-match-stats-event';
import { ShowReplayEvent } from './events/replays/show-replay-event';
import { ShowReplaysEvent } from './events/replays/show-replays-event';
import { TriggerShowMatchStatsEvent } from './events/replays/trigger-show-match-stats-event';
import { SceneChangedEvent } from './events/scene-changed-event';
import { ShowMainWindowEvent } from './events/show-main-window-event';
import { CloseSocialShareModalEvent } from './events/social/close-social-share-modal-event';
import { ShareVideoOnSocialNetworkEvent } from './events/social/share-video-on-social-network-event';
import { StartSocialSharingEvent } from './events/social/start-social-sharing-event';
import { TriggerSocialNetworkLoginToggleEvent } from './events/social/trigger-social-network-login-toggle-event';
import { UpdateTwitterSocialInfoEvent } from './events/social/update-twitter-social-info-event';
import { GamesFullClearEvent } from './events/stats/game-stats-full-clear-event';
import { GamesFullRefreshEvent } from './events/stats/game-stats-full-refresh-event';
import { GlobalStatsLoadedEvent } from './events/stats/global/global-stats-loaded-event';
import { GlobalStatsUpdatedEvent } from './events/stats/global/global-stats-updated-event';
import { RecomputeGameStatsEvent } from './events/stats/recompute-game-stats-event';
import { StatsXpGraphFilterSelectedEvent } from './events/stats/stats-xp-graph-filter-selected-event';
import { UpdateGameStatsEvent } from './events/stats/update-game-stats-event';
import { StoreInitEvent } from './events/store-init-event';
import { LiveStreamsDataLoadedEvent } from './events/streams/live-streams-data-loaded-event';
import { LiveStreamsForceReloadEvent } from './events/streams/live-streams-force-reload-event';
import { NavigationHistory } from './navigation-history';
import { AchievementCompletedProcessor } from './processors/achievements/achievement-completed-processor';
import { AchievementHistoryCreatedProcessor } from './processors/achievements/achievement-history-created-processor';
import { AchievementsFullRefreshProcessor } from './processors/achievements/achievements-full-refresh-processor';
import { AchievementsFullUpdatedProcessor } from './processors/achievements/achievements-full-updated-processor';
import { AchievementsInitProcessor } from './processors/achievements/achievements-init-processor';
import { AchievementsUpdatedProcessor } from './processors/achievements/achievements-updated-processor';
import { ChangeVisibleAchievementProcessor } from './processors/achievements/change-visible-achievement-processor';
import { FilterShownAchievementsProcessor } from './processors/achievements/filter-shown-achievements-processor';
import { SelectAchievementCategoryProcessor } from './processors/achievements/select-achievement-category-processor';
import { ShowAchievementDetailsProcessor } from './processors/achievements/show-achievement-details-processor';
import { ArenaClassFilterSelectedProcessor } from './processors/arena/arena-class-filter-selected-processor';
import { ArenaRewardsUpdatedProcessor } from './processors/arena/arena-rewards-updated-processor';
import { ArenaTimeFilterSelectedProcessor } from './processors/arena/arena-time-filter-selected-processor';
import { BattlegroundsMainWindowSelectBattleProcessor } from './processors/battlegrounds/battlegrounds-main-window-select-battle-processor';
import { BgsBestStatsLoadedProcessor } from './processors/battlegrounds/bgs-best-stats-loaded-processor';
import { BgsHeroFilterSelectedProcessor } from './processors/battlegrounds/bgs-hero-filter-selected-processor';
import { BgsHeroSortFilterSelectedProcessor } from './processors/battlegrounds/bgs-hero-sort-filter-selected-processor';
import { BattlegroundsMetaHeroStatsLoadedProcessor } from './processors/battlegrounds/bgs-meta-hero-stats-loaded-processor';
import { BattlegroundsMetaHeroStrategiesLoadedProcessor } from './processors/battlegrounds/bgs-meta-hero-strategies-loaded-processor';
import { BgsMmrGroupFilterSelectedProcessor } from './processors/battlegrounds/bgs-mmr-group-filter-selected-processor';
import { BattlegroundsPerfectGamesLoadedProcessor } from './processors/battlegrounds/bgs-perfect-games-loaded-processor';
import { BgsPersonalStatsSelectHeroDetailsProcessor } from './processors/battlegrounds/bgs-personal-stats-select-hero-details-processor';
import { BgsPersonalStatsSelectHeroDetailsWithRemoteInfoProcessor } from './processors/battlegrounds/bgs-personal-stats-select-hero-details-with-remote-info-processor';
import { BgsPostMatchStatsComputedProcessor } from './processors/battlegrounds/bgs-post-match-stats-computed-event';
import { BgsQuestsDataLoadedProcessor } from './processors/battlegrounds/bgs-quests-data-loaded-processor';
import { BgsRankFilterSelectedProcessor } from './processors/battlegrounds/bgs-rank-filter-selected-processor';
import { BgsRequestNewGlobalStatsLoadProcessor } from './processors/battlegrounds/bgs-request-new-global-stats-load-processor';
import { BgsShowStrategiesProcessor } from './processors/battlegrounds/bgs-show-strategies-processor';
import { BgsTimeFilterSelectedProcessor } from './processors/battlegrounds/bgs-time-filter-selected-processor';
import { BgsTribesFilterSelectedProcessor } from './processors/battlegrounds/bgs-tribes-filter-selected-processor';
import { SelectBattlegroundsCategoryProcessor } from './processors/battlegrounds/select-battlegrounds-category-processor';
import { SelectBattlegroundsPersonalStatsHeroProcessor } from './processors/battlegrounds/select-battlegrounds-personal-stats-hero-processor';
import { BgsCustomSimulationResetProcessor } from './processors/battlegrounds/simulator/bgs-custom-simulation-reset-processor';
import { BgsCustomSimulationUpdateProcessor } from './processors/battlegrounds/simulator/bgs-custom-simulation-update-processor';
import { BgsSimulatorMinionTierFilterSelectedProcessor } from './processors/battlegrounds/simulator/bgs-simulator-minion-tier-filter-selected-processor';
import { BgsSimulatorMinionTribeFilterSelectedProcessor } from './processors/battlegrounds/simulator/bgs-simulator-minion-tribe-filter-selected-processor';
import { ChangeVisibleApplicationProcessor } from './processors/change-visible-application-processor';
import { CloseMainWindowProcessor } from './processors/close-main-window-processor';
import { CollectionInitProcessor } from './processors/collection/collection-init-processor';
import { CollectionPacksUpdatedProcessor } from './processors/collection/collection-packs-updated-processor';
import { CollectionRefreshPacksProcessor } from './processors/collection/collection-refresh-packs-processor';
import { CollectionSelectCurrentTabProcessor } from './processors/collection/collection-select-current-tab-processor';
import { LoadMoreCardHistoryProcessor } from './processors/collection/load-more-card-history-processor';
import { NewCardProcessor } from './processors/collection/new-card-processor';
import { NewPackProcessor } from './processors/collection/new-pack-processor';
import { SearchCardProcessor } from './processors/collection/search-card-processor';
import { SelectCollectionSetProcessor } from './processors/collection/select-collection-set-processor';
import { ShowCardBackDetailsProcessor } from './processors/collection/show-card-back-details-processor';
import { ShowCardDetailsProcessor } from './processors/collection/show-card-details-processor';
import { UpdateCardSearchResultsProcessor } from './processors/collection/update-card-search-results-processor';
import { CurrentUserProcessor } from './processors/current-user-process.ts';
import { ChangeDeckFormatFilterProcessor } from './processors/decktracker/change-deck-format-filter-processor';
import { ChangeDeckModeFilterProcessor } from './processors/decktracker/change-deck-mode-filter-processor';
import { ChangeDeckRankCategoryFilterProcessor } from './processors/decktracker/change-deck-rank-category-filter-processor';
import { ChangeDeckRankFilterProcessor } from './processors/decktracker/change-deck-rank-filter-processor';
import { ChangeDeckRankGroupProcessor } from './processors/decktracker/change-deck-rank-group-processor';
import { ChangeDeckSortProcessor } from './processors/decktracker/change-deck-sort-processor';
import { ChangeDeckTimeFilterProcessor } from './processors/decktracker/change-deck-time-filter-processor';
import { ConstructedDeckbuilderClassSelectedProcessor } from './processors/decktracker/constructed-deckbuilder-class-selected-processor';
import { ConstructedDeckbuilderFormatSelectedProcessor } from './processors/decktracker/constructed-deckbuilder-format-selected-processor';
import { ConstructedDeckbuilderGoBackProcessor } from './processors/decktracker/constructed-deckbuilder-go-back-processor';
import { ConstructedDeckbuilderImportDeckProcessor } from './processors/decktracker/constructed-deckbuilder-import-deck-processor';
import { ConstructedDeckbuilderSaveDeckProcessor } from './processors/decktracker/constructed-deckbuilder-save-deck-processor';
import { ConstructedEjectDeckVersionProcessor } from './processors/decktracker/constructed-eject-deck-version-processor';
import { ConstructedMetaDecksLoadedProcessor } from './processors/decktracker/constructed-meta-decks-loaded-processor';
import { ConstructedNewDeckVersionProcessor } from './processors/decktracker/constructed-new-deck-version-processor';
import { ConstructedToggleDeckVersionStatsProcessor } from './processors/decktracker/constructed-toggle-deck-version-stats-processor';
import { DecktrackerDeleteDeckProcessor } from './processors/decktracker/decktracker-delete-deck-processor';
import { DecktrackerResetDeckStatsProcessor } from './processors/decktracker/decktracker-reset-deck-stats-processor';
import { HideDeckSummaryProcessor } from './processors/decktracker/hide-deck-summary-processor';
import { RestoreDeckSummaryProcessor } from './processors/decktracker/restore-deck-summary-processor';
import { SelectDeckDetailsProcessor } from './processors/decktracker/select-deck-details-processor';
import { SelectDeckViewProcessor } from './processors/decktracker/select-decks-view-processor';
import { ToggleShowHiddenDecksProcessor } from './processors/decktracker/toggle-show-hidden-decks-processor';
import { DuelsDeckbuilderImportDeckProcessor } from './processors/duels/duels-deckbuilder-import-deck-processor';
import { DuelsDecksSearchProcessor } from './processors/duels/duels-decks-search-processor';
import { DuelsGameModeFilterSelectedProcessor } from './processors/duels/duels-game-mode-filter-selected-processor';
import { DuelsHeroPowerFilterSelectedProcessor } from './processors/duels/duels-hero-power-filter-selected-processor';
import { DuelsHeroSearchProcessor } from './processors/duels/duels-hero-search-processor';
import { DuelsHeroSortFilterSelectedProcessor } from './processors/duels/duels-hero-sort-filter-selected-processor';
import { DuelsHidePersonalDeckSummaryProcessor } from './processors/duels/duels-hide-personal-deck-summary-processor';
import { DuelsLeaderboardGameModeFilterSelectedProcessor } from './processors/duels/duels-leaderboard-game-mode-filter-selected-processor';
import { DuelsMmrFilterSelectedProcessor } from './processors/duels/duels-mmr-filter-selected-processor';
import { DuelsPassivesFilterSelectedProcessor } from './processors/duels/duels-passives-filter-selected-processor';
import { DuelsPersonalDeckRenameProcessor } from './processors/duels/duels-personal-deck-rename-processor';
import { DuelsRequestNewGlobalStatsLoadProcessor } from './processors/duels/duels-request-new-global-stats-load-processor';
import { DuelsRestorePersonalDeckSummaryProcessor } from './processors/duels/duels-restore-personal-deck-summary-processor';
import { DuelsSelectCategoryProcessor } from './processors/duels/duels-select-category-processor';
import { DuelsSignatureTreasureFilterSelectedProcessor } from './processors/duels/duels-signature-treasure-filter-selected-processor';
import { DuelsStatTypeFilterSelectedProcessor } from './processors/duels/duels-stat-type-filter-selected-processor';
import { DuelsTimeFilterSelectedProcessor } from './processors/duels/duels-time-filter-selected-processor';
import { DuelsToggleExpandedRunProcessor } from './processors/duels/duels-toggle-expanded-run-processor';
import { DuelsToggleShowHiddenPersonalDecksProcessor } from './processors/duels/duels-toggle-show-hidden-personal-decks-processor';
import { DuelsTopDeckRunDetailsLoadedProcessor } from './processors/duels/duels-top-deck-run-details-loaded-processor';
import { DuelsHeroFilterSelectedProcessor } from './processors/duels/duels-top-decks-class-filter-selected-processor';
import { DuelsTopDecksDustFilterSelectedProcessor } from './processors/duels/duels-top-decks-dust-filter-selected-processor';
import { DuelsTopDecksUpdateProcessor } from './processors/duels/duels-top-decks-update-processor';
import { DuelsTreasurePassiveTypeFilterSelectedProcessor } from './processors/duels/duels-treasure-passive-type-filter-selected-processor';
import { DuelsTreasureSearchProcessor } from './processors/duels/duels-treasure-search-processor';
import { DuelsTreasureSortFilterSelectedProcessor } from './processors/duels/duels-treasure-sort-filter-selected-processor';
import { DuelsViewDeckDetailsProcessor } from './processors/duels/duels-view-deck-details-processor';
import { DuelsViewPersonalDeckDetailsProcessor } from './processors/duels/duels-view-personal-deck-details-processor';
import { DungeonLootInfoUpdatedProcessor } from './processors/duels/dungeon-loot-info-updated-processor';
import { NextFtueProcessor } from './processors/ftue/next-ftue-processor';
import { PreviousFtueProcessor } from './processors/ftue/previous-ftue-processor';
import { SkipFtueProcessor } from './processors/ftue/skip-ftue-processor';
import { GenericPreferencesUpdateProcessor } from './processors/generic-preferences-update-processor';
import { LocalizationUpdateProcessor } from './processors/localization-update-processor';
import { MercenariesAddMercToBackupTeamProcessor } from './processors/mercenaries/mercenaries-add-merc-to-backup-team-processor';
import { MercenariesCollectionInformationFromMemoryProcessor } from './processors/mercenaries/mercenaries-collection-information-from-memory-processor';
import { MercenariesGlobalStatsLoadedProcessor } from './processors/mercenaries/mercenaries-global-stats-loaded-processor';
import { MercenariesHeroLevelFilterSelectedProcessor } from './processors/mercenaries/mercenaries-hero-level-filter-selected-processor';
import { MercenariesHeroSearchProcessor } from './processors/mercenaries/mercenaries-hero-search-processor';
import { MercenariesHeroSelectedProcessor } from './processors/mercenaries/mercenaries-hero-selected-processor';
import { MercenariesHideTeamSummaryProcessor } from './processors/mercenaries/mercenaries-hide-team-summary-processor';
import { MercenariesMapInformationFromMemoryProcessor } from './processors/mercenaries/mercenaries-map-information-from-memory-processor';
import { MercenariesModeFilterSelectedProcessor } from './processors/mercenaries/mercenaries-mode-filter-selected-processor';
import { MercenariesPersonalHeroesSortProcessor } from './processors/mercenaries/mercenaries-personal-heroes-sort-processor';
import { MercenariesPveDifficultyFilterSelectedProcessor } from './processors/mercenaries/mercenaries-pve-difficulty-filter-selected-processor';
import { MercenariesPvpMmrFilterSelectedProcessor } from './processors/mercenaries/mercenaries-pvp-mmr-filter-selected-processor';
import { MercenariesReferenceDataLoadedProcessor } from './processors/mercenaries/mercenaries-reference-data-loaded-processor';
import { MercenariesRemoveMercToBackupTeamProcessor } from './processors/mercenaries/mercenaries-remove-merc-to-backup-team-processor';
import { MercenariesRestoreTeamSummaryProcessor } from './processors/mercenaries/mercenaries-restore-team-summary-processor';
import { MercenariesRoleFilterSelectedProcessor } from './processors/mercenaries/mercenaries-role-filter-selected-processor';
import { MercenariesSelectCategoryProcessor } from './processors/mercenaries/mercenaries-select-category-processor';
import { MercenariesSelectCompositionProcessor } from './processors/mercenaries/mercenaries-select-composition-processor';
import { MercenariesStarterFilterSelectedProcessor } from './processors/mercenaries/mercenaries-starter-filter-selected-processor';
import { MercenariesToggleShowHiddenTeamsProcessor } from './processors/mercenaries/mercenaries-toggle-show-hidden-teams-processor';
import { MercenariesViewMercDetailsProcessor } from './processors/mercenaries/mercenaries-view-merc-details-processor';
import { NavigationBackProcessor } from './processors/navigation/navigation-back-processor';
import { NavigationNextProcessor } from './processors/navigation/navigation-next-processor';
import { Processor } from './processors/processor';
import { ActiveQuestsUpdatedProcessor } from './processors/quests/active-quests-updated-processor';
import { ReferenceQuestsLoadedProcessor } from './processors/quests/reference-quests-loaded-processor';
import { ChangeMatchStatsNumberOfTabsProcessor } from './processors/replays/change-match-stats-number-of-tabs-processor';
import { SelectMatchStatsTabProcessor } from './processors/replays/select-match-stats-tab-processor';
import { ShowMatchStatsProcessor } from './processors/replays/show-match-stats-processor';
import { ShowReplayProcessor } from './processors/replays/show-replay-processor';
import { ShowReplaysProcessor } from './processors/replays/show-replays-processor';
import { TriggerShowMatchStatsProcessor } from './processors/replays/trigger-show-match-stats-processor';
import { SceneChangedProcessor } from './processors/scene-changed-processor';
import { ShowMainWindowProcessor } from './processors/show-main-window-processor';
import { CloseSocialShareModalProcessor } from './processors/social/close-social-share-modal-processor';
import { ShareVideoOnSocialNetworkProcessor } from './processors/social/share-video-on-social-network-processor';
import { StartSocialSharingProcessor } from './processors/social/start-social-sharing-processor';
import { TriggerSocialNetworkLoginToggleProcessor } from './processors/social/trigger-social-network-login-toggle-processor';
import { UpdateTwitterSocialInfoProcessor } from './processors/social/update-twitter-social-info-processor';
import { GameStatsFullClearProcessor } from './processors/stats/game-stats-full-clear-processor';
import { GameStatsFullRefreshProcessor } from './processors/stats/game-stats-full-refresh-processor';
import { GlobalStatsLoadedProcessor } from './processors/stats/global/global-stats-loaded-processor';
import { GlobalStatsUpdatedProcessor } from './processors/stats/global/global-stats-updated-processor';
import { RecomputeGameStatsProcessor } from './processors/stats/recompute-game-stats-processor';
import { StatsXpGraphFilterSelectedProcessor } from './processors/stats/stats-xp-graph-filter-selected-processor';
import { UpdateGameStatsProcessor } from './processors/stats/update-game-stats-processor';
import { LiveStreamsDataLoadedProcessor } from './processors/sterams/live-streams-data-loaded-processor';
import { LiveStreamsForceReloadProcessor } from './processors/sterams/live-streams-force-reload-processor';
import { StoreInitProcessor } from './processors/store-init-processor';
import { StateHistory } from './state-history';
import { StoreBootstrapService } from './store-bootstrap.service';

const MAX_HISTORY_SIZE = 30;

@Injectable()
export class MainWindowStoreService {
	public stateUpdater = new EventEmitter<MainWindowStoreEvent>();
	public state: MainWindowState = new MainWindowState();
	public navigationState = new NavigationState();

	private navigationHistory = new NavigationHistory();
	private mergedEmitter = new BehaviorSubject<[MainWindowState, NavigationState]>([this.state, this.navigationState]);
	private processors: Map<string, Processor>;

	private processingQueue = new ProcessingQueue<MainWindowStoreEvent>(
		(eventQueue) => this.processQueue(eventQueue),
		50,
		'main-window-store',
	);

	constructor(
		private readonly cards: CardsFacadeService,
		private readonly sets: SetsService,
		private readonly achievementsRepository: AchievementsRepository,
		private readonly collectionManager: CollectionManager,
		private readonly cardHistoryStorage: CardHistoryStorageService,
		private readonly achievementHistoryStorage: AchievementHistoryStorageService,
		private readonly achievementsLoader: AchievementsLoaderService,
		private readonly remoteAchievements: RemoteAchievementsService,
		private readonly collectionDb: CollectionStorageService,
		private readonly gameStatsUpdater: GameStatsUpdaterService,
		private readonly gameStatsLoader: GameStatsLoaderService,
		private readonly ow: OverwolfService,
		private readonly memoryReading: MemoryInspectionService,
		private readonly events: Events,
		private readonly notifs: OwNotificationsService,
		private readonly userService: UserService,
		private readonly decktrackerStateLoader: DecktrackerStateLoaderService,
		private readonly storeBootstrap: StoreBootstrapService,
		private readonly bgsGlobalStats: BgsGlobalStatsService,
		private readonly replaysStateBuilder: ReplaysStateBuilderService,
		private readonly prefs: PreferencesService,
		private readonly decksProvider: DecksProviderService,
		private readonly duelsDeckProvider: DuelsDecksProviderService,
		private readonly bgsRunStatsService: BgsRunStatsService,
		private readonly duelsBuilder: DuelsStateBuilderService,
		private readonly mercenariesMemoryCache: MercenariesMemoryCacheService,
		private readonly duelsMemoryCache: DuelsMemoryCacheService,
		private readonly translate: TranslateService,
		private readonly i18n: LocalizationService,
		private readonly packsService: PackStatsService,
		private readonly streamsService: LiveStreamsService,
		private readonly duelsAccess: DuelsMetaHeroStatsAccessService,
	) {
		this.userService.init(this);
		window['mainWindowStoreMerged'] = this.mergedEmitter;
		window['mainWindowStoreUpdater'] = this.stateUpdater;
		this.gameStatsUpdater.stateUpdater = this.stateUpdater;

		this.processors = this.buildProcessors();

		this.stateUpdater.subscribe((event: MainWindowStoreEvent) => {
			this.processingQueue.enqueue(event);
		});

		// this.ow.addGameInfoUpdatedListener(async (res: any) => {
		// 	if (this.ow.gameLaunched(res)) {
		// 		// Do both so that it's hidden right away
		// 		// const prefs = await this.prefs.getPreferences();
		// 		// this.ow.hideCollectionWindow(prefs);
		// 		// this.stateUpdater.next(new CloseMainWindowEvent());
		// 		// Give a bit of time for memory info to be there?
		// 		setTimeout(() => {
		// 			this.populateStore(true);
		// 		}, 2000);
		// 	}
		// });

		// this.populateStore();
		this.listenForSocialAccountLoginUpdates();
	}

	private async processQueue(eventQueue: readonly MainWindowStoreEvent[]): Promise<readonly MainWindowStoreEvent[]> {
		const event = eventQueue[0];
		const start = Date.now();
		const processor: Processor = this.processors.get(event.eventName());
		if (!processor) {
			console.error('[store] missing processor for event', event.eventName());
			return;
		}
		// Don't modify the current state here, as it could make state lookup impossible
		// (for back / forward arrows for instance)
		try {
			const [newState, newNavState] = await processor.process(
				event,
				this.state,
				this.navigationHistory,
				this.navigationState,
			);
			let stateWithNavigation: NavigationState;

			if (newNavState) {
				if (event.eventName() === NavigationBackEvent.eventName()) {
					this.navigationHistory.currentIndexInHistory--;
				} else if (event.eventName() === NavigationNextEvent.eventName()) {
					this.navigationHistory.currentIndexInHistory++;
				} else {
					this.addStateToHistory(newNavState, event);
				}
				// We don't want to store the status of the navigation arrows, as when going back
				// or forward with the history arrows, the state of these arrows will change
				// vs what they originally were when the state was stored
				this.navigationState = newNavState;

				stateWithNavigation = this.updateNavigationArrows(this.navigationState, newState);
			}
			if (newState) {
				this.state = newState;
				if (Date.now() - start > 1000) {
					console.warn(
						'[store] Event',
						event.eventName(),
						'processing took too long, consider splitting it',
						Date.now() - start,
					);
				}
			} else {
			}

			// console.debug('emitting new merged state', event.eventName(), this.state, this.state.quests);
			this.mergedEmitter.next([
				this.state,
				// Because some events don't emit a new navigationState, in which case the arrows
				// are lost
				stateWithNavigation ?? this.updateNavigationArrows(this.navigationState, newState),
			]);
		} catch (e) {
			console.error('[store] exception while processing event', event.eventName(), event, e.message, e.stack, e);
		}

		return eventQueue.slice(1);
	}

	private addStateToHistory(newNavigationState: NavigationState, originalEvent: MainWindowStoreEvent): void {
		if (!originalEvent.isNavigationEvent()) {
			return;
		}
		const event = originalEvent.eventName();
		const historyTrunk = this.navigationHistory.stateHistory.slice(
			0,
			this.navigationHistory.currentIndexInHistory + 1,
		);
		const newHistory = {
			event: event,
			state: newNavigationState,
		} as StateHistory;
		this.navigationHistory.stateHistory = [...historyTrunk, newHistory];
		this.navigationHistory.currentIndexInHistory = this.navigationHistory.stateHistory.length - 1;

		if (this.navigationHistory.stateHistory.length > MAX_HISTORY_SIZE) {
			this.navigationHistory.stateHistory = this.navigationHistory.stateHistory.slice(1);
		}
	}

	private updateNavigationArrows(navigationState: NavigationState, dataState: MainWindowState): NavigationState {
		const backArrowEnabled =
			// Only allow back / next within the same app (at least for now)
			(this.navigationHistory.currentIndexInHistory > 0 &&
				this.navigationHistory.stateHistory[this.navigationHistory.currentIndexInHistory - 1].state
					.currentApp === navigationState.currentApp) ||
			// We allow a "back" to the parent in case there is no back history
			NavigationBackProcessor.buildParentState(navigationState, dataState) != null;

		// 	'isBackArrowEnabled?',
		// 	backArrowEnabled,
		// 	this.navigationHistory.currentIndexInHistory > 0,
		// 	this.navigationHistory.stateHistory[this.navigationHistory.currentIndexInHistory - 1]?.state?.currentApp ===
		// 		navigationState.currentApp,
		// 	NavigationBackProcessor.buildParentState(navigationState, dataState),
		// 	this.navigationHistory.stateHistory[this.navigationHistory.currentIndexInHistory - 1]?.state,
		// 	this.navigationHistory,
		// 	navigationState,
		// );
		const nextArrowEnabled =
			this.navigationHistory.currentIndexInHistory < this.navigationHistory.stateHistory.length - 1;
		return navigationState.update({
			backArrowEnabled: backArrowEnabled,
			nextArrowEnabled: nextArrowEnabled,
		} as NavigationState);
	}

	private buildProcessors(): Map<string, Processor> {
		const processors: readonly [string, Processor][] = [
			[StoreInitEvent.eventName(), new StoreInitProcessor(this.events, this.prefs, this.i18n)],
			[GlobalStatsLoadedEvent.eventName(), new GlobalStatsLoadedProcessor()],
			[NavigationBackEvent.eventName(), new NavigationBackProcessor()],
			[NavigationNextEvent.eventName(), new NavigationNextProcessor()],
			[ChangeVisibleApplicationEvent.eventName(), new ChangeVisibleApplicationProcessor(this.prefs, this.i18n)],
			[CloseMainWindowEvent.eventName(), new CloseMainWindowProcessor()],
			[ShowMainWindowEvent.eventName(), new ShowMainWindowProcessor()],
			[CurrentUserEvent.eventName(), new CurrentUserProcessor()],
			[GenericPreferencesUpdateEvent.eventName(), new GenericPreferencesUpdateProcessor(this.prefs)],
			[LocalizationUpdateEvent.eventName(), new LocalizationUpdateProcessor(this.prefs, this.translate)],
			[SceneChangedEvent.eventName(), new SceneChangedProcessor()],
			[
				// Quests
				ReferenceQuestsLoadedEvent.eventName(),
				new ReferenceQuestsLoadedProcessor(),
			],
			[ActiveQuestsUpdatedEvent.eventName(), new ActiveQuestsUpdatedProcessor(this.memoryReading)],
			[
				// Collection
				CollectionInitEvent.eventName(),
				new CollectionInitProcessor(),
			],
			[CollectionRefreshPacksEvent.eventName(), new CollectionRefreshPacksProcessor(this.packsService)],
			[CollectionPacksUpdatedEvent.eventName(), new CollectionPacksUpdatedProcessor()],
			[CollectionSelectCurrentTabEvent.eventName(), new CollectionSelectCurrentTabProcessor()],
			[SearchCardsEvent.eventName(), new SearchCardProcessor(this.collectionManager, this.sets, this.i18n)],
			[LoadMoreCardHistoryEvent.eventName(), new LoadMoreCardHistoryProcessor(this.cardHistoryStorage)],
			[SelectCollectionSetEvent.eventName(), new SelectCollectionSetProcessor()],
			[ShowCardDetailsEvent.eventName(), new ShowCardDetailsProcessor(this.cards)],
			[ShowCardBackDetailsEvent.eventName(), new ShowCardBackDetailsProcessor(this.collectionManager)],
			[
				UpdateCardSearchResultsEvent.eventName(),
				new UpdateCardSearchResultsProcessor(this.collectionManager, this.sets),
			],
			[NewPackEvent.eventName(), new NewPackProcessor(this.collectionManager, this.cards)],
			[
				NewCardEvent.eventName(),
				new NewCardProcessor(this.collectionDb, this.collectionManager, this.cardHistoryStorage),
			],
			[
				// Achievements
				AchievementsInitEvent.eventName(),
				new AchievementsInitProcessor(),
			],
			[AchievementsFullRefreshEvent.eventName(), new AchievementsFullRefreshProcessor(this.remoteAchievements)],
			[
				AchievementsFullUpdatedEvent.eventName(),
				new AchievementsFullUpdatedProcessor(this.achievementsRepository),
			],
			[
				AchievementHistoryCreatedEvent.eventName(),
				new AchievementHistoryCreatedProcessor(this.achievementHistoryStorage, this.achievementsLoader),
			],
			[ChangeVisibleAchievementEvent.eventName(), new ChangeVisibleAchievementProcessor()],
			[SelectAchievementCategoryEvent.eventName(), new SelectAchievementCategoryProcessor()],
			[SelectAchievementCategoryEvent.eventName(), new SelectAchievementCategoryProcessor()],
			[ShowAchievementDetailsEvent.eventName(), new ShowAchievementDetailsProcessor()],
			[AchievementsUpdatedEvent.eventName(), new AchievementsUpdatedProcessor()],
			[AchievementCompletedEvent.eventName(), new AchievementCompletedProcessor(this.achievementHistoryStorage)],
			[FilterShownAchievementsEvent.eventName(), new FilterShownAchievementsProcessor()],
			[GlobalStatsUpdatedEvent.eventName(), new GlobalStatsUpdatedProcessor(this.events)],
			[
				// Social
				StartSocialSharingEvent.eventName(),
				new StartSocialSharingProcessor(),
			],
			[TriggerSocialNetworkLoginToggleEvent.eventName(), new TriggerSocialNetworkLoginToggleProcessor()],
			[UpdateTwitterSocialInfoEvent.eventName(), new UpdateTwitterSocialInfoProcessor(this.ow)],
			[ShareVideoOnSocialNetworkEvent.eventName(), new ShareVideoOnSocialNetworkProcessor(this.ow)],
			[CloseSocialShareModalEvent.eventName(), new CloseSocialShareModalProcessor()],
			[
				// Ftue
				NextFtueEvent.eventName(),
				new NextFtueProcessor(this.prefs),
			],
			[PreviousFtueEvent.eventName(), new PreviousFtueProcessor()],
			[SkipFtueEvent.eventName(), new SkipFtueProcessor(this.prefs)],
			// Stats
			[
				RecomputeGameStatsEvent.eventName(),
				new RecomputeGameStatsProcessor(this.decktrackerStateLoader, this.events, this.prefs),
			],
			[
				UpdateGameStatsEvent.eventName(),
				new UpdateGameStatsProcessor(this.decktrackerStateLoader, this.events, this.prefs),
			],
			[GamesFullRefreshEvent.eventName(), new GameStatsFullRefreshProcessor(this.gameStatsLoader)],
			[GamesFullClearEvent.eventName(), new GameStatsFullClearProcessor(this.gameStatsLoader)],
			[
				// Mailbox
				MailboxMarkMessageReadEvent.eventName(),
				new MailboxMarkMessageReadProcessor(this.prefs),
			],
			[
				// Replays
				ShowReplayEvent.eventName(),
				new ShowReplayProcessor(this.bgsRunStatsService, this.i18n),
			],
			[ShowReplaysEvent.eventName(), new ShowReplaysProcessor(this.prefs)],
			[
				TriggerShowMatchStatsEvent.eventName(),
				new TriggerShowMatchStatsProcessor(this.bgsRunStatsService, this.prefs, this.i18n),
			],
			[ShowMatchStatsEvent.eventName(), new ShowMatchStatsProcessor(this.prefs, this.i18n, this.cards)],
			[SelectMatchStatsTabEvent.eventName(), new SelectMatchStatsTabProcessor(this.prefs)],
			[ChangeMatchStatsNumberOfTabsEvent.eventName(), new ChangeMatchStatsNumberOfTabsProcessor(this.prefs)],
			[
				// Decktracker
				SelectDecksViewEvent.eventName(),
				new SelectDeckViewProcessor(),
			],
			[SelectDeckDetailsEvent.eventName(), new SelectDeckDetailsProcessor(this.decksProvider)],
			[ChangeDeckFormatFilterEvent.eventName(), new ChangeDeckFormatFilterProcessor(this.prefs)],
			[ChangeDeckRankFilterEvent.eventName(), new ChangeDeckRankFilterProcessor(this.prefs)],
			[ChangeDeckRankGroupEvent.eventName(), new ChangeDeckRankGroupProcessor(this.prefs)],
			[ChangeDeckRankCategoryFilterEvent.eventName(), new ChangeDeckRankCategoryFilterProcessor(this.prefs)],
			[
				// TODO: remove this
				ChangeDeckModeFilterEvent.eventName(),
				new ChangeDeckModeFilterProcessor(),
			],
			[ChangeDeckTimeFilterEvent.eventName(), new ChangeDeckTimeFilterProcessor(this.prefs)],
			[ChangeDeckSortEvent.eventName(), new ChangeDeckSortProcessor(this.prefs)],
			[HideDeckSummaryEvent.eventName(), new HideDeckSummaryProcessor(this.prefs)],
			[DecktrackerResetDeckStatsEvent.eventName(), new DecktrackerResetDeckStatsProcessor(this.prefs)],
			[DecktrackerDeleteDeckEvent.eventName(), new DecktrackerDeleteDeckProcessor(this.prefs)],
			[RestoreDeckSummaryEvent.eventName(), new RestoreDeckSummaryProcessor(this.prefs)],
			[ToggleShowHiddenDecksEvent.eventName(), new ToggleShowHiddenDecksProcessor(this.prefs)],
			[ConstructedDeckbuilderGoBackEvent.eventName(), new ConstructedDeckbuilderGoBackProcessor()],
			[
				ConstructedDeckbuilderFormatSelectedEvent.eventName(),
				new ConstructedDeckbuilderFormatSelectedProcessor(),
			],
			[ConstructedDeckbuilderClassSelectedEvent.eventName(), new ConstructedDeckbuilderClassSelectedProcessor()],
			[ConstructedDeckbuilderSaveDeckEvent.eventName(), new ConstructedDeckbuilderSaveDeckProcessor(this.prefs)],
			[
				ConstructedDeckbuilderImportDeckEvent.eventName(),
				new ConstructedDeckbuilderImportDeckProcessor(this.cards),
			],
			[ConstructedMetaDecksLoadedEvent.eventName(), new ConstructedMetaDecksLoadedProcessor()],
			[ConstructedNewDeckVersionEvent.eventName(), new ConstructedNewDeckVersionProcessor(this.prefs)],
			[ConstructedEjectDeckVersionEvent.eventName(), new ConstructedEjectDeckVersionProcessor(this.prefs)],
			[ConstructedToggleDeckVersionStatsEvent.eventName(), new ConstructedToggleDeckVersionStatsProcessor()],
			// Battlegrounds
			[SelectBattlegroundsCategoryEvent.eventName(), new SelectBattlegroundsCategoryProcessor()],
			[BgsBestStatsLoadedEvent.eventName(), new BgsBestStatsLoadedProcessor()],
			[BgsTimeFilterSelectedEvent.eventName(), new BgsTimeFilterSelectedProcessor(this.prefs, this.stateUpdater)],
			[BgsRankFilterSelectedEvent.eventName(), new BgsRankFilterSelectedProcessor(this.prefs)],
			[
				BgsTribesFilterSelectedEvent.eventName(),
				new BgsTribesFilterSelectedProcessor(this.prefs, this.stateUpdater),
			],
			[
				BgsRequestNewGlobalStatsLoadEvent.eventName(),
				new BgsRequestNewGlobalStatsLoadProcessor(this.bgsGlobalStats),
			],
			[BgsHeroSortFilterSelectedEvent.eventName(), new BgsHeroSortFilterSelectedProcessor(this.prefs)],
			[BgsHeroFilterSelectedEvent.eventName(), new BgsHeroFilterSelectedProcessor(this.prefs)],
			[BgsMmrGroupFilterSelectedEvent.eventName(), new BgsMmrGroupFilterSelectedProcessor(this.prefs)],
			[
				BgsPostMatchStatsComputedEvent.eventName(),
				new BgsPostMatchStatsComputedProcessor(this.replaysStateBuilder),
			],
			[
				BgsPersonalStatsSelectHeroDetailsEvent.eventName(),
				new BgsPersonalStatsSelectHeroDetailsProcessor(this.events, this.cards, this.i18n),
			],
			[
				BgsPersonalStatsSelectHeroDetailsWithRemoteInfoEvent.eventName(),
				new BgsPersonalStatsSelectHeroDetailsWithRemoteInfoProcessor(),
			],
			[
				SelectBattlegroundsPersonalStatsHeroTabEvent.eventName(),
				new SelectBattlegroundsPersonalStatsHeroProcessor(),
			],
			[BgsCustomSimulationUpdateEvent.eventName(), new BgsCustomSimulationUpdateProcessor()],
			[BgsCustomSimulationResetEvent.eventName(), new BgsCustomSimulationResetProcessor()],
			[
				BgsSimulatorMinionTribeFilterSelectedEvent.eventName(),
				new BgsSimulatorMinionTribeFilterSelectedProcessor(this.prefs),
			],
			[
				BgsSimulatorMinionTierFilterSelectedEvent.eventName(),
				new BgsSimulatorMinionTierFilterSelectedProcessor(this.prefs),
			],
			[
				BattlegroundsMainWindowSelectBattleEvent.eventName(),
				new BattlegroundsMainWindowSelectBattleProcessor(this.i18n),
			],
			[BattlegroundsPerfectGamesLoadedEvent.eventName(), new BattlegroundsPerfectGamesLoadedProcessor()],
			[BattlegroundsMetaHeroStatsLoadedEvent.eventName(), new BattlegroundsMetaHeroStatsLoadedProcessor()],
			[
				BattlegroundsMetaHeroStrategiesLoadedEvent.eventName(),
				new BattlegroundsMetaHeroStrategiesLoadedProcessor(),
			],
			[BgsQuestsDataLoadedEvent.eventName(), new BgsQuestsDataLoadedProcessor()],
			[BgsShowStrategiesEvent.eventName(), new BgsShowStrategiesProcessor(this.events, this.cards, this.i18n)],

			// Streams
			[LiveStreamsDataLoadedEvent.eventName(), new LiveStreamsDataLoadedProcessor()],
			[LiveStreamsForceReloadEvent.eventName(), new LiveStreamsForceReloadProcessor(this.streamsService)],
			// Mercenaries
			[MercenariesGlobalStatsLoadedEvent.eventName(), new MercenariesGlobalStatsLoadedProcessor()],
			[MercenariesReferenceDataLoadedEvent.eventName(), new MercenariesReferenceDataLoadedProcessor()],
			[MercenariesModeFilterSelectedEvent.eventName(), new MercenariesModeFilterSelectedProcessor(this.prefs)],
			[MercenariesRoleFilterSelectedEvent.eventName(), new MercenariesRoleFilterSelectedProcessor(this.prefs)],
			[
				MercenariesPveDifficultyFilterSelectedEvent.eventName(),
				new MercenariesPveDifficultyFilterSelectedProcessor(this.prefs),
			],
			[
				MercenariesPvpMmrFilterSelectedEvent.eventName(),
				new MercenariesPvpMmrFilterSelectedProcessor(this.prefs),
			],
			[
				MercenariesStarterFilterSelectedEvent.eventName(),
				new MercenariesStarterFilterSelectedProcessor(this.prefs),
			],
			[
				MercenariesHeroLevelFilterSelectedEvent.eventName(),
				new MercenariesHeroLevelFilterSelectedProcessor(this.prefs),
			],
			[MercenariesHeroSelectedEvent.eventName(), new MercenariesHeroSelectedProcessor(this.cards)],
			[MercenariesHeroSearchEvent.eventName(), new MercenariesHeroSearchProcessor()],
			[MercenariesSelectCompositionEvent.eventName(), new MercenariesSelectCompositionProcessor(this.i18n)],
			[MercenariesSelectCategoryEvent.eventName(), new MercenariesSelectCategoryProcessor()],
			[
				MercenariesCollectionInformationFromMemoryEvent.eventName(),
				new MercenariesCollectionInformationFromMemoryProcessor(),
			],
			[MercenariesMapInformationFromMemoryEvent.eventName(), new MercenariesMapInformationFromMemoryProcessor()],
			[MercenariesPersonalHeroesSortEvent.eventName(), new MercenariesPersonalHeroesSortProcessor(this.prefs)],
			[MercenariesHideTeamSummaryEvent.eventName(), new MercenariesHideTeamSummaryProcessor(this.prefs)],
			[MercenariesRestoreTeamSummaryEvent.eventName(), new MercenariesRestoreTeamSummaryProcessor(this.prefs)],
			[
				MercenariesToggleShowHiddenTeamsEvent.eventName(),
				new MercenariesToggleShowHiddenTeamsProcessor(this.prefs),
			],
			[MercenariesViewMercDetailsEvent.eventName(), new MercenariesViewMercDetailsProcessor()],
			[MercenariesAddMercToBackupTeamEvent.eventName(), new MercenariesAddMercToBackupTeamProcessor(this.prefs)],
			[
				MercenariesRemoveMercToBackupTeamEvent.eventName(),
				new MercenariesRemoveMercToBackupTeamProcessor(this.prefs),
			],
			// Duels
			[DuelsStateUpdatedEvent.eventName(), new DuelsStateUpdatedProcessor()],
			[DuelsTopDecksUpdateEvent.eventName(), new DuelsTopDecksUpdateProcessor(this.cards, this.i18n)],
			[DungeonLootInfoUpdatedEvent.eventName(), new DungeonLootInfoUpdatedProcessor()],
			[DuelsSelectCategoryEvent.eventName(), new DuelsSelectCategoryProcessor()],
			[
				DuelsHeroSortFilterSelectedEvent.eventName(),
				new DuelsHeroSortFilterSelectedProcessor(this.duelsBuilder, this.prefs),
			],
			[
				DuelsStatTypeFilterSelectedEvent.eventName(),
				new DuelsStatTypeFilterSelectedProcessor(this.duelsBuilder, this.prefs),
			],
			[
				DuelsTreasureSortFilterSelectedEvent.eventName(),
				new DuelsTreasureSortFilterSelectedProcessor(this.duelsBuilder, this.prefs),
			],
			[
				DuelsGameModeFilterSelectedEvent.eventName(),
				new DuelsGameModeFilterSelectedProcessor(this.duelsBuilder, this.prefs),
			],
			[
				DuelsLeaderboardGameModeFilterSelectedEvent.eventName(),
				new DuelsLeaderboardGameModeFilterSelectedProcessor(this.prefs),
			],
			[
				DuelsTimeFilterSelectedEvent.eventName(),
				new DuelsTimeFilterSelectedProcessor(this.prefs, this.stateUpdater),
			],
			[
				DuelsTreasurePassiveTypeFilterSelectedEvent.eventName(),
				new DuelsTreasurePassiveTypeFilterSelectedProcessor(this.duelsBuilder, this.prefs),
			],
			[
				DuelsTopDecksHeroFilterSelectedEvent.eventName(),
				new DuelsHeroFilterSelectedProcessor(this.duelsBuilder, this.prefs),
			],
			[DuelsPassivesFilterSelectedEvent.eventName(), new DuelsPassivesFilterSelectedProcessor(this.prefs)],
			[
				DuelsTopDecksDustFilterSelectedEvent.eventName(),
				new DuelsTopDecksDustFilterSelectedProcessor(this.duelsBuilder, this.prefs),
			],
			[
				DuelsMmrFilterSelectedEvent.eventName(),
				new DuelsMmrFilterSelectedProcessor(this.prefs, this.stateUpdater),
			],
			[DuelsHeroPowerFilterSelectedEvent.eventName(), new DuelsHeroPowerFilterSelectedProcessor(this.prefs)],
			[
				DuelsSignatureTreasureFilterSelectedEvent.eventName(),
				new DuelsSignatureTreasureFilterSelectedProcessor(this.prefs),
			],
			[
				DuelsPersonalDeckRenameEvent.eventName(),
				new DuelsPersonalDeckRenameProcessor(this.duelsBuilder, this.prefs),
			],
			[DuelsViewDeckDetailsEvent.eventName(), new DuelsViewDeckDetailsProcessor(this.events, this.i18n)],
			[
				DuelsViewPersonalDeckDetailsEvent.eventName(),
				new DuelsViewPersonalDeckDetailsProcessor(this.prefs, this.i18n, this.duelsDeckProvider),
			],
			[DuelsTopDeckRunDetailsLoadedEvent.eventName(), new DuelsTopDeckRunDetailsLoadedProcessor()],
			[
				DuelsHidePersonalDeckSummaryEvent.eventName(),
				new DuelsHidePersonalDeckSummaryProcessor(this.duelsBuilder, this.prefs),
			],
			[DuelsDeletePersonalDeckSummaryEvent.eventName(), new DuelsDeletePersonalDeckSummaryProcessor(this.prefs)],
			[
				DuelsRestorePersonalDeckSummaryEvent.eventName(),
				new DuelsRestorePersonalDeckSummaryProcessor(this.duelsBuilder, this.prefs),
			],
			[
				DuelsToggleShowHiddenPersonalDecksEvent.eventName(),
				new DuelsToggleShowHiddenPersonalDecksProcessor(this.duelsBuilder, this.prefs),
			],
			[DuelsToggleExpandedRunEvent.eventName(), new DuelsToggleExpandedRunProcessor()],
			[DuelsTreasureSearchEvent.eventName(), new DuelsTreasureSearchProcessor()],
			[DuelsHeroSearchEvent.eventName(), new DuelsHeroSearchProcessor()],
			[DuelsDecksSearchEvent.eventName(), new DuelsDecksSearchProcessor()],
			[
				DuelsRequestNewGlobalStatsLoadEvent.eventName(),
				new DuelsRequestNewGlobalStatsLoadProcessor(this.duelsAccess, this.prefs),
			],
			[DuelsCurrentDeckEvent.eventName(), new DuelsCurrentDeckProcessor()],
			[DuelsIsOnMainScreenEvent.eventName(), new DuelsIsOnMainScreenProcessor()],
			[
				DuelsIsOnDeckBuildingLobbyScreenEvent.eventName(),
				new DuelsIsOnDeckBuildingLobbyScreenProcessor(this.memoryReading),
			],
			[DuelsCurrentOptionEvent.eventName(), new DuelsCurrentOptionParser(this.cards, this.memoryReading)],
			[
				DuelsChoosingHeroEvent.eventName(),
				new DuelsChoosingHeroParser(this.memoryReading, this.duelsMemoryCache),
			],
			[DuelsExploreDecksEvent.eventName(), new DuelsExploreDecksParser(this.prefs)],
			[DuelsBuildDeckEvent.eventName(), new DuelsBuildDeckParser(this.cards)],
			[DuelsDeckbuilderGoBackEvent.eventName(), new DuelsDeckbuilderGoBackProcessor()],
			[DuelsDeckbuilderHeroSelectedEvent.eventName(), new DuelsDeckbuilderHeroSelectedProcessor()],
			[DuelsDeckbuilderHeroPowerSelectedEvent.eventName(), new DuelsDeckbuilderHeroPowerSelectedProcessor()],
			[
				DuelsDeckbuilderSignatureTreasureSelectedEvent.eventName(),
				new DuelsDeckbuilderSignatureTreasureSelectedProcessor(this.cards),
			],
			[DuelsDeckbuilderSaveDeckEvent.eventName(), new DuelsDeckbuilderSaveDeckProcessor(this.prefs)],
			[DuelsDeckbuilderImportDeckEvent.eventName(), new DuelsDeckbuilderImportDeckProcessor(this.cards)],
			[
				// Arena
				ArenaTimeFilterSelectedEvent.eventName(),
				new ArenaTimeFilterSelectedProcessor(this.prefs),
			],
			[ArenaClassFilterSelectedEvent.eventName(), new ArenaClassFilterSelectedProcessor(this.prefs)],
			[ArenaRewardsUpdatedEvent.eventName(), new ArenaRewardsUpdatedProcessor()],
			[
				// Stats
				StatsXpGraphFilterSelectedEvent.eventName(),
				new StatsXpGraphFilterSelectedProcessor(this.prefs),
			],
		];

		return Map(processors);
	}

	public populateStore(onlyGameData = false) {
		// if (!onlyGameData) {
		console.log('sending populate store event');
		this.storeBootstrap.initStore(this.state);
		// } else {
		// 	this.events.broadcast(Events.START_POPULATE_COLLECTION_STATE);
		// }
		// Launch events to start gathering data for the store
		// this.stateUpdater.next(new PopulateStoreEvent());
		// this.stateUpdater.next(new TriggerPopulateStoreEvent(onlyGameData));
	}

	private listenForSocialAccountLoginUpdates() {
		this.ow.addTwitterLoginStateChangedListener(() => {
			this.stateUpdater.next(new UpdateTwitterSocialInfoEvent());
		});
		this.events.on(Events.MEMORY_UPDATE).subscribe((event) => {
			const changes: MemoryUpdate = event.data[0];
			const newScene = changes.CurrentScene;
			if (!!newScene) {
				this.stateUpdater.next(new SceneChangedEvent(newScene));
			}
		});
	}
}
