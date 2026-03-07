import { Inject, Injectable, NgZone } from '@angular/core';
import {
	AchievementHistoryService,
	AchievementsMemoryMonitor,
	AchievementsNavigationService,
	AchievementsStateManagerService,
	FirestoneRemoteAchievementsLoaderService,
} from '@firestone/achievements/common';
import { AchievementsRefLoaderService } from '@firestone/achievements/data-access';
import { ArenaNavigationService } from '@firestone/arena/common';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/services';
import { BgsSimulatorControllerService } from '@firestone/battlegrounds/simulator';
import { CollectionNavigationService } from '@firestone/collection/common';
import { ConstructedNavigationService, ConstructedPersonalDecksService } from '@firestone/constructed/common';
import {
	AchievementCompletedEvent,
	AchievementsFullRefreshEvent,
	BattlegroundsMainWindowSelectBattleEvent,
	BgsHeroFilterSelectedEvent,
	BgsHeroSortFilterSelectedEvent,
	BgsPersonalStatsSelectHeroDetailsEvent,
	BgsPersonalStatsSelectHeroDetailsWithRemoteInfoEvent,
	BgsPostMatchStatsComputedEvent,
	BgsShowStrategiesEvent,
	ChangeDeckFormatFilterEvent,
	ChangeDeckModeFilterEvent,
	ChangeDeckRankCategoryFilterEvent,
	ChangeDeckRankFilterEvent,
	ChangeDeckRankGroupEvent,
	ChangeDeckSortEvent,
	ChangeDeckTimeFilterEvent,
	ChangeVisibleAchievementEvent,
	ChangeVisibleApplicationEvent,
	CloseMainWindowEvent,
	CloseSocialShareModalEvent,
	CollectionPacksUpdatedEvent,
	CollectionRefreshPacksEvent,
	CollectionSelectCurrentTabEvent,
	ConstructedDeckbuilderClassSelectedEvent,
	ConstructedDeckbuilderFormatSelectedEvent,
	ConstructedDeckbuilderGoBackEvent,
	ConstructedDeckbuilderImportDeckEvent,
	ConstructedDeckbuilderSaveDeckEvent,
	ConstructedEjectDeckVersionEvent,
	ConstructedNewDeckVersionEvent,
	ConstructedToggleDeckVersionStatsEvent,
	DecktrackerDeleteDeckEvent,
	DecktrackerResetDeckStatsEvent,
	FilterShownAchievementsEvent,
	GamesFullClearEvent,
	GamesFullRefreshEvent,
	GenericPreferencesUpdateEvent,
	HideDeckSummaryEvent,
	LocalizationUpdateEvent,
	MercenariesAddMercToBackupTeamEvent,
	MercenariesHeroLevelFilterSelectedEvent,
	MercenariesHeroSelectedEvent,
	MercenariesHideTeamSummaryEvent,
	MercenariesModeFilterSelectedEvent,
	MercenariesPersonalHeroesSortEvent,
	MercenariesPveDifficultyFilterSelectedEvent,
	MercenariesRemoveMercToBackupTeamEvent,
	MercenariesRestoreTeamSummaryEvent,
	MercenariesRoleFilterSelectedEvent,
	MercenariesSelectCategoryEvent,
	MercenariesStarterFilterSelectedEvent,
	MercenariesToggleShowHiddenTeamsEvent,
	NavigationBackEvent,
	NavigationNextEvent,
	NewPackEvent,
	NextFtueEvent,
	PreviousFtueEvent,
	RecomputeGameStatsEvent,
	RestoreDeckSummaryEvent,
	SearchCardsEvent,
	SelectAchievementCategoryEvent,
	SelectBattlegroundsCategoryEvent,
	SelectCollectionSetEvent,
	SelectDeckDetailsEvent,
	SelectDecksViewEvent,
	ShowAchievementDetailsEvent,
	ShowCardBackDetailsEvent,
	ShowCardDetailsEvent,
	ShowMainWindowEvent,
	ShowMatchStatsEvent,
	ShowReplayEvent,
	ShowReplaysEvent,
	SkipFtueEvent,
	StartSocialSharingEvent,
	StatsXpGraphFilterSelectedEvent,
	ToggleShowHiddenDecksEvent,
	TriggerShowMatchStatsEvent,
	UpdateCardSearchResultsEvent,
	IMainWindowStoreService,
	MainWindowNavigationService,
	MainWindowState,
	MainWindowStoreEvent,
	NavigationState,
} from '@firestone/mainwindow/common';
import { AppNavigationService, Events, PreferencesService } from '@firestone/shared/common/service';
import {
	CardsFacadeService,
	ILocalizationService,
	IWindowHandlerService,
	ProcessingQueue,
	waitForReady,
	WINDOW_HANDLER_SERVICE_TOKEN,
} from '@firestone/shared/framework/core';
import { GameStatsLoaderService } from '@firestone/stats/data-access';
import { TranslateService } from '@ngx-translate/core';
import { Map } from 'immutable';
import { BehaviorSubject, filter } from 'rxjs';
import { PackStatsService } from '../../../../libs/packs/services/pack-stats.service';
import { BgsPerfectGamesService } from '@firestone/battlegrounds/data-access';
import { BgsRunStatsService } from '../../battlegrounds/bgs-run-stats.service';
import { CollectionManager } from '../../collection/collection-manager.service';
import { SetsManagerService } from '../../collection/sets-manager.service';
import { SetsService } from '@firestone/collection/data-access';
import { DecksProviderService } from '../../decktracker/main/decks-provider.service';
import { CollectionBootstrapService } from './collection-bootstrap.service';
import { AchievementCompletedProcessor } from './processors/achievements/achievement-completed-processor';
import { AchievementsFullRefreshProcessor } from './processors/achievements/achievements-full-refresh-processor';
import {
	AchievementsRemovePinnedAchievementsEvent,
	AchievementsRemovePinnedAchievementsProcessor,
} from './processors/achievements/achievements-remove-pinned-achievements';
import {
	AchievementsTrackRandomAchievementsEvent,
	AchievementsTrackRandomAchievementsProcessor,
} from './processors/achievements/achievements-track-random-achievements';
import { ChangeVisibleAchievementProcessor } from './processors/achievements/change-visible-achievement-processor';
import { FilterShownAchievementsProcessor } from './processors/achievements/filter-shown-achievements-processor';
import { SelectAchievementCategoryProcessor } from './processors/achievements/select-achievement-category-processor';
import { ShowAchievementDetailsProcessor } from './processors/achievements/show-achievement-details-processor';
import { BattlegroundsMainWindowSelectBattleProcessor } from './processors/battlegrounds/battlegrounds-main-window-select-battle-processor';
import { BgsHeroFilterSelectedProcessor } from './processors/battlegrounds/bgs-hero-filter-selected-processor';
import { BgsHeroSortFilterSelectedProcessor } from './processors/battlegrounds/bgs-hero-sort-filter-selected-processor';
import { BgsPersonalStatsSelectHeroDetailsProcessor } from './processors/battlegrounds/bgs-personal-stats-select-hero-details-processor';
import { BgsPersonalStatsSelectHeroDetailsWithRemoteInfoProcessor } from './processors/battlegrounds/bgs-personal-stats-select-hero-details-with-remote-info-processor';
import { BgsPostMatchStatsComputedProcessor } from './processors/battlegrounds/bgs-post-match-stats-computed-event';
import { BgsShowStrategiesProcessor } from './processors/battlegrounds/bgs-show-strategies-processor';
import { SelectBattlegroundsCategoryProcessor } from './processors/battlegrounds/select-battlegrounds-category-processor';
import { ChangeVisibleApplicationProcessor } from './processors/change-visible-application-processor';
import { CloseMainWindowProcessor } from './processors/close-main-window-processor';
import { CollectionPacksUpdatedProcessor } from './processors/collection/collection-packs-updated-processor';
import { CollectionRefreshPacksProcessor } from './processors/collection/collection-refresh-packs-processor';
import { CollectionSelectCurrentTabProcessor } from './processors/collection/collection-select-current-tab-processor';
import { NewPackProcessor } from './processors/collection/new-pack-processor';
import { SearchCardProcessor } from './processors/collection/search-card-processor';
import { SelectCollectionSetProcessor } from './processors/collection/select-collection-set-processor';
import { ShowCardBackDetailsProcessor } from './processors/collection/show-card-back-details-processor';
import { ShowCardDetailsProcessor } from './processors/collection/show-card-details-processor';
import { UpdateCardSearchResultsProcessor } from './processors/collection/update-card-search-results-processor';
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
import {
	ConstructedMetaArchetypeShowDecksEvent,
	ConstructedMetaArchetypeShowDecksProcessor,
} from './processors/decktracker/constructed-meta-archetype-show-decks';
import {
	ConstructedMetaArchetypeDetailsShowEvent,
	ConstructedMetaArchetypeDetailsShowProcessor,
} from './processors/decktracker/constructed-meta-archetype-show-details';
import {
	ConstructedMetaDeckDetailsShowEvent,
	ConstructedMetaDeckDetailsShowProcessor,
} from './processors/decktracker/constructed-meta-deck-show-details';
import { ConstructedNewDeckVersionProcessor } from './processors/decktracker/constructed-new-deck-version-processor';
import { ConstructedToggleDeckVersionStatsProcessor } from './processors/decktracker/constructed-toggle-deck-version-stats-processor';
import { DecktrackerDeleteDeckProcessor } from './processors/decktracker/decktracker-delete-deck-processor';
import { DecktrackerResetDeckStatsProcessor } from './processors/decktracker/decktracker-reset-deck-stats-processor';
import { HideDeckSummaryProcessor } from './processors/decktracker/hide-deck-summary-processor';
import { RestoreDeckSummaryProcessor } from './processors/decktracker/restore-deck-summary-processor';
import { SelectDeckDetailsProcessor } from './processors/decktracker/select-deck-details-processor';
import { SelectDeckViewProcessor } from './processors/decktracker/select-decks-view-processor';
import { ToggleShowHiddenDecksProcessor } from './processors/decktracker/toggle-show-hidden-decks-processor';
import { NextFtueProcessor } from './processors/ftue/next-ftue-processor';
import { PreviousFtueProcessor } from './processors/ftue/previous-ftue-processor';
import { SkipFtueProcessor } from './processors/ftue/skip-ftue-processor';
import { GenericPreferencesUpdateProcessor } from './processors/generic-preferences-update-processor';
import { LocalizationUpdateProcessor } from './processors/localization-update-processor';
import { MercenariesAddMercToBackupTeamProcessor } from './processors/mercenaries/mercenaries-add-merc-to-backup-team-processor';
import { MercenariesHeroLevelFilterSelectedProcessor } from './processors/mercenaries/mercenaries-hero-level-filter-selected-processor';
import { MercenariesHeroSelectedProcessor } from './processors/mercenaries/mercenaries-hero-selected-processor';
import { MercenariesHideTeamSummaryProcessor } from './processors/mercenaries/mercenaries-hide-team-summary-processor';
import { MercenariesModeFilterSelectedProcessor } from './processors/mercenaries/mercenaries-mode-filter-selected-processor';
import { MercenariesPersonalHeroesSortProcessor } from './processors/mercenaries/mercenaries-personal-heroes-sort-processor';
import { MercenariesPveDifficultyFilterSelectedProcessor } from './processors/mercenaries/mercenaries-pve-difficulty-filter-selected-processor';
import { MercenariesRemoveMercToBackupTeamProcessor } from './processors/mercenaries/mercenaries-remove-merc-to-backup-team-processor';
import { MercenariesRestoreTeamSummaryProcessor } from './processors/mercenaries/mercenaries-restore-team-summary-processor';
import { MercenariesRoleFilterSelectedProcessor } from './processors/mercenaries/mercenaries-role-filter-selected-processor';
import { MercenariesSelectCategoryProcessor } from './processors/mercenaries/mercenaries-select-category-processor';
import { MercenariesStarterFilterSelectedProcessor } from './processors/mercenaries/mercenaries-starter-filter-selected-processor';
import { MercenariesToggleShowHiddenTeamsProcessor } from './processors/mercenaries/mercenaries-toggle-show-hidden-teams-processor';
import { NavigationBackProcessor } from './processors/navigation/navigation-back-processor';
import { NavigationNextProcessor } from './processors/navigation/navigation-next-processor';
import { Processor } from './processors/processor';
import { ShowMatchStatsProcessor } from './processors/replays/show-match-stats-processor';
import { ShowReplayProcessor } from './processors/replays/show-replay-processor';
import { ShowReplaysProcessor } from './processors/replays/show-replays-processor';
import { TriggerShowMatchStatsProcessor } from './processors/replays/trigger-show-match-stats-processor';
import { ShowMainWindowProcessor } from './processors/show-main-window-processor';
import { CloseSocialShareModalProcessor } from './processors/social/close-social-share-modal-processor';
import { StartSocialSharingProcessor } from './processors/social/start-social-sharing-processor';
import { GameStatsFullClearProcessor } from './processors/stats/game-stats-full-clear-processor';
import { GameStatsFullRefreshProcessor } from './processors/stats/game-stats-full-refresh-processor';
import { ProfileSelectCategoryEvent, ProfileSelectCategoryProcessor } from './processors/stats/profile-select-category';
import { RecomputeGameStatsProcessor } from './processors/stats/recompute-game-stats-processor';
import { StatsXpGraphFilterSelectedProcessor } from './processors/stats/stats-xp-graph-filter-selected-processor';
import { StoreInitProcessor } from './processors/store-init-processor';
import { StoreBootstrapService } from './store-bootstrap.service';

const MAX_HISTORY_SIZE = 30;

@Injectable()
export class MainWindowStoreService implements IMainWindowStoreService {
	public mainWindowState$$ = new BehaviorSubject<MainWindowState | null>(null);
	public navigationState$$ = new BehaviorSubject<NavigationState | null>(null);

	private processors: Map<string, Processor>;
	private processingQueue: ProcessingQueue<MainWindowStoreEvent>;

	constructor(
		private readonly cards: CardsFacadeService,
		private readonly sets: SetsService,
		private readonly collectionManager: CollectionManager,
		private readonly achievementHistory: AchievementHistoryService,
		private readonly firestoneRemoteAchievements: FirestoneRemoteAchievementsLoaderService,
		private readonly gameStatsLoader: GameStatsLoaderService,
		private readonly events: Events,
		private readonly storeBootstrap: StoreBootstrapService,
		private readonly prefs: PreferencesService,
		private readonly decksProvider: DecksProviderService,
		private readonly bgsRunStatsService: BgsRunStatsService,
		private readonly translate: TranslateService,
		private readonly i18n: ILocalizationService,
		private readonly packsService: PackStatsService,
		private readonly setsManager: SetsManagerService,
		private readonly collectionBootstrap: CollectionBootstrapService,
		private readonly achievementsManager: AchievementsMemoryMonitor,
		private readonly achievementsStateManager: AchievementsStateManagerService,
		private readonly achievementsRefLoader: AchievementsRefLoaderService,
		private readonly gameStats: GameStatsLoaderService,
		private readonly bgsPerfectGames: BgsPerfectGamesService,
		private readonly constructedPersonalDeckService: ConstructedPersonalDecksService,
		private readonly constructedNavigation: ConstructedNavigationService,
		private readonly collectionNavigation: CollectionNavigationService,
		private readonly arenaNavigation: ArenaNavigationService,
		private readonly battlegroundsNavigation: BattlegroundsNavigationService,
		private readonly mainNavigation: MainWindowNavigationService,
		private readonly achievementsNavigation: AchievementsNavigationService,
		private readonly simulationController: BgsSimulatorControllerService,
		private readonly appNavigation: AppNavigationService,
		private readonly ngZone: NgZone,
		@Inject(WINDOW_HANDLER_SERVICE_TOKEN) private readonly windowHandler: IWindowHandlerService,
	) {
		this.processingQueue = new ProcessingQueue<MainWindowStoreEvent>(
			(eventQueue) => this.processQueue(eventQueue),
			250,
			'main-window-store',
			undefined,
			this.ngZone,
		);
		this.initService();
	}

	public async init() {
		console.log('building initial window state');
		this.navigationState$$.subscribe((state) => {
			this.mainNavigation.navigationState$$.next(state);
		});
		const prefs = await this.prefs.getPreferences();
		const state = this.storeBootstrap.buildInitialStore(prefs);
		const navState = await new StoreInitProcessor(
			this.prefs,
			this.i18n,
			this.mainNavigation,
			this.collectionNavigation,
			this.battlegroundsNavigation,
			this.constructedNavigation,
			this.achievementsNavigation,
			this.arenaNavigation,
		).buildCurrentAppNavState(state, new NavigationState(), prefs);
		this.mainWindowState$$.next(state);
		this.navigationState$$.next(navState);
		console.log('initial window state built');
	}

	public send(event: MainWindowStoreEvent) {
		this.processingQueue.enqueue(event);
	}

	private async initService() {
		this.processors = this.buildProcessors();

		await waitForReady(this.appNavigation);
		this.appNavigation.currentTab$$.pipe(filter((tab) => !!tab)).subscribe((tab) => {
			console.debug('[navigation] changing tab', tab);
			this.send(new ChangeVisibleApplicationEvent(tab));
		});
	}

	private async processQueue(eventQueue: readonly MainWindowStoreEvent[]): Promise<readonly MainWindowStoreEvent[]> {
		console.debug('handling events', eventQueue);
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
			let currentState = this.mainWindowState$$.value;
			let currentNavState = this.navigationState$$.value;
			const [newState, newNavState] = await processor.process(event, currentState, currentNavState);

			if (newNavState) {
				this.navigationState$$.next(newNavState);
			}
			if (newState) {
				this.mainWindowState$$.next(newState);
				if (Date.now() - start > 1000) {
					console.warn(
						'[store] Event',
						event.eventName(),
						'processing took too long, consider splitting it',
						Date.now() - start,
					);
				}
			}
		} catch (e) {
			console.error('[store] exception while processing event', event.eventName(), event, e.message, e.stack, e);
		}

		return eventQueue.slice(1);
	}

	private buildProcessors(): Map<string, Processor> {
		const processors: readonly [string, Processor][] = [
			[
				NavigationBackEvent.eventName(),
				new NavigationBackProcessor(
					this.setsManager,
					this.mainNavigation,
					this.collectionNavigation,
					this.achievementsNavigation,
					this.achievementsStateManager,
					this.battlegroundsNavigation,
				),
			],
			[NavigationNextEvent.eventName(), new NavigationNextProcessor(this.mainNavigation)],
			[
				ChangeVisibleApplicationEvent.eventName(),
				new ChangeVisibleApplicationProcessor(
					this.prefs,
					this.i18n,
					this.mainNavigation,
					this.collectionNavigation,
					this.battlegroundsNavigation,
					this.constructedNavigation,
					this.achievementsNavigation,
					this.arenaNavigation,
				),
			],
			[CloseMainWindowEvent.eventName(), new CloseMainWindowProcessor(this.mainNavigation)],
			[ShowMainWindowEvent.eventName(), new ShowMainWindowProcessor(this.mainNavigation)],
			[GenericPreferencesUpdateEvent.eventName(), new GenericPreferencesUpdateProcessor(this.prefs)],
			[LocalizationUpdateEvent.eventName(), new LocalizationUpdateProcessor(this.prefs, this.translate)],
			// Collection
			[CollectionRefreshPacksEvent.eventName(), new CollectionRefreshPacksProcessor(this.packsService)],
			[CollectionPacksUpdatedEvent.eventName(), new CollectionPacksUpdatedProcessor()],
			[
				CollectionSelectCurrentTabEvent.eventName(),
				new CollectionSelectCurrentTabProcessor(this.collectionNavigation, this.mainNavigation),
			],
			[
				SearchCardsEvent.eventName(),
				new SearchCardProcessor(
					this.collectionManager,
					this.sets,
					this.i18n,
					this.collectionNavigation,
					this.mainNavigation,
				),
			],
			[
				SelectCollectionSetEvent.eventName(),
				new SelectCollectionSetProcessor(this.setsManager, this.collectionNavigation, this.mainNavigation),
			],
			[
				ShowCardDetailsEvent.eventName(),
				new ShowCardDetailsProcessor(
					this.cards,
					this.setsManager,
					this.collectionNavigation,
					this.mainNavigation,
				),
			],
			[
				ShowCardBackDetailsEvent.eventName(),
				new ShowCardBackDetailsProcessor(
					this.collectionManager,
					this.collectionNavigation,
					this.mainNavigation,
				),
			],
			[
				UpdateCardSearchResultsEvent.eventName(),
				new UpdateCardSearchResultsProcessor(this.collectionManager, this.sets, this.mainNavigation),
			],
			[NewPackEvent.eventName(), new NewPackProcessor(this.collectionBootstrap, this.cards)],

			// Achievements
			[
				AchievementsFullRefreshEvent.eventName(),
				new AchievementsFullRefreshProcessor(this.firestoneRemoteAchievements),
			],
			[
				ChangeVisibleAchievementEvent.eventName(),
				new ChangeVisibleAchievementProcessor(this.achievementsStateManager, this.achievementsNavigation),
			],
			[
				SelectAchievementCategoryEvent.eventName(),
				new SelectAchievementCategoryProcessor(
					this.achievementsStateManager,
					this.mainNavigation,
					this.achievementsNavigation,
				),
			],
			[
				SelectAchievementCategoryEvent.eventName(),
				new SelectAchievementCategoryProcessor(
					this.achievementsStateManager,
					this.mainNavigation,
					this.achievementsNavigation,
				),
			],
			[
				ShowAchievementDetailsEvent.eventName(),
				new ShowAchievementDetailsProcessor(
					this.achievementsStateManager,
					this.mainNavigation,
					this.achievementsNavigation,
				),
			],
			[AchievementCompletedEvent.eventName(), new AchievementCompletedProcessor(this.achievementHistory)],
			[
				FilterShownAchievementsEvent.eventName(),
				new FilterShownAchievementsProcessor(
					this.achievementsStateManager,
					this.mainNavigation,
					this.achievementsNavigation,
				),
			],
			[
				AchievementsRemovePinnedAchievementsEvent.eventName(),
				new AchievementsRemovePinnedAchievementsProcessor(this.prefs),
			],
			[
				AchievementsTrackRandomAchievementsEvent.eventName(),
				new AchievementsTrackRandomAchievementsProcessor(
					this.prefs,
					this.achievementsManager,
					this.achievementsStateManager,
					this.achievementsRefLoader,
				),
			],

			// Social
			[StartSocialSharingEvent.eventName(), new StartSocialSharingProcessor()],
			// [ShareVideoOnSocialNetworkEvent.eventName(), new ShareVideoOnSocialNetworkProcessor(this.ow)],
			[CloseSocialShareModalEvent.eventName(), new CloseSocialShareModalProcessor()],
			// Ftue
			[NextFtueEvent.eventName(), new NextFtueProcessor(this.prefs, this.mainNavigation)],
			[PreviousFtueEvent.eventName(), new PreviousFtueProcessor(this.mainNavigation)],
			[SkipFtueEvent.eventName(), new SkipFtueProcessor(this.prefs, this.mainNavigation)],
			// Stats
			[RecomputeGameStatsEvent.eventName(), new RecomputeGameStatsProcessor(this.gameStats)],
			[GamesFullRefreshEvent.eventName(), new GameStatsFullRefreshProcessor(this.gameStatsLoader)],
			[GamesFullClearEvent.eventName(), new GameStatsFullClearProcessor(this.gameStatsLoader)],
			// Replays
			[
				ShowReplayEvent.eventName(),
				new ShowReplayProcessor(
					this.bgsRunStatsService,
					this.i18n,
					this.gameStats,
					this.bgsPerfectGames,
					this.mainNavigation,
				),
			],
			[ShowReplaysEvent.eventName(), new ShowReplaysProcessor(this.prefs, this.mainNavigation)],
			[
				TriggerShowMatchStatsEvent.eventName(),
				new TriggerShowMatchStatsProcessor(
					this.bgsRunStatsService,
					this.prefs,
					this.i18n,
					this.gameStats,
					this.bgsPerfectGames,
					this.mainNavigation,
				),
			],
			[
				ShowMatchStatsEvent.eventName(),
				new ShowMatchStatsProcessor(
					this.prefs,
					this.i18n,
					this.cards,
					this.gameStats,
					this.bgsPerfectGames,
					this.mainNavigation,
				),
			],
			// Decktracker
			[SelectDecksViewEvent.eventName(), new SelectDeckViewProcessor(this.constructedNavigation)],
			[
				SelectDeckDetailsEvent.eventName(),
				new SelectDeckDetailsProcessor(this.decksProvider, this.mainNavigation, this.constructedNavigation),
			],
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
			[
				DecktrackerDeleteDeckEvent.eventName(),
				new DecktrackerDeleteDeckProcessor(
					this.prefs,
					this.gameStats,
					this.constructedPersonalDeckService,
					this.constructedNavigation,
				),
			],
			[RestoreDeckSummaryEvent.eventName(), new RestoreDeckSummaryProcessor(this.prefs)],
			[ToggleShowHiddenDecksEvent.eventName(), new ToggleShowHiddenDecksProcessor(this.prefs)],
			[ConstructedDeckbuilderGoBackEvent.eventName(), new ConstructedDeckbuilderGoBackProcessor()],
			[
				ConstructedDeckbuilderFormatSelectedEvent.eventName(),
				new ConstructedDeckbuilderFormatSelectedProcessor(),
			],
			[ConstructedDeckbuilderClassSelectedEvent.eventName(), new ConstructedDeckbuilderClassSelectedProcessor()],
			[
				ConstructedDeckbuilderSaveDeckEvent.eventName(),
				new ConstructedDeckbuilderSaveDeckProcessor(this.prefs, this.constructedPersonalDeckService),
			],
			[
				ConstructedDeckbuilderImportDeckEvent.eventName(),
				new ConstructedDeckbuilderImportDeckProcessor(this.cards),
			],
			[ConstructedNewDeckVersionEvent.eventName(), new ConstructedNewDeckVersionProcessor(this.prefs)],
			[ConstructedEjectDeckVersionEvent.eventName(), new ConstructedEjectDeckVersionProcessor(this.prefs)],
			[ConstructedToggleDeckVersionStatsEvent.eventName(), new ConstructedToggleDeckVersionStatsProcessor()],
			[
				ConstructedMetaDeckDetailsShowEvent.eventName(),
				new ConstructedMetaDeckDetailsShowProcessor(this.constructedNavigation),
			],
			[
				ConstructedMetaArchetypeDetailsShowEvent.eventName(),
				new ConstructedMetaArchetypeDetailsShowProcessor(this.constructedNavigation),
			],
			[
				ConstructedMetaArchetypeShowDecksEvent.eventName(),
				new ConstructedMetaArchetypeShowDecksProcessor(this.prefs, this.constructedNavigation),
			],
			// Battlegrounds
			[
				SelectBattlegroundsCategoryEvent.eventName(),
				new SelectBattlegroundsCategoryProcessor(this.battlegroundsNavigation, this.mainNavigation),
			],
			// [
			// 	BgsRequestNewGlobalStatsLoadEvent.eventName(),
			// 	new BgsRequestNewGlobalStatsLoadProcessor(this.bgsGlobalStats),
			// ],
			[BgsHeroSortFilterSelectedEvent.eventName(), new BgsHeroSortFilterSelectedProcessor(this.prefs)],
			[BgsHeroFilterSelectedEvent.eventName(), new BgsHeroFilterSelectedProcessor(this.prefs)],
			[BgsPostMatchStatsComputedEvent.eventName(), new BgsPostMatchStatsComputedProcessor(this.gameStats)],
			[
				BgsPersonalStatsSelectHeroDetailsEvent.eventName(),
				new BgsPersonalStatsSelectHeroDetailsProcessor(
					this.events,
					this.cards,
					this.i18n,
					this.battlegroundsNavigation,
					this.mainNavigation,
				),
			],
			[
				BgsPersonalStatsSelectHeroDetailsWithRemoteInfoEvent.eventName(),
				new BgsPersonalStatsSelectHeroDetailsWithRemoteInfoProcessor(),
			],
			[
				BattlegroundsMainWindowSelectBattleEvent.eventName(),
				new BattlegroundsMainWindowSelectBattleProcessor(
					this.i18n,
					this.battlegroundsNavigation,
					this.mainNavigation,
					this.prefs,
					this.simulationController,
					this.windowHandler,
				),
			],
			[
				BgsShowStrategiesEvent.eventName(),
				new BgsShowStrategiesProcessor(
					this.events,
					this.cards,
					this.i18n,
					this.battlegroundsNavigation,
					this.mainNavigation,
				),
			],

			// Mercenaries
			[MercenariesModeFilterSelectedEvent.eventName(), new MercenariesModeFilterSelectedProcessor(this.prefs)],
			[MercenariesRoleFilterSelectedEvent.eventName(), new MercenariesRoleFilterSelectedProcessor(this.prefs)],
			[
				MercenariesPveDifficultyFilterSelectedEvent.eventName(),
				new MercenariesPveDifficultyFilterSelectedProcessor(this.prefs),
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
			[MercenariesSelectCategoryEvent.eventName(), new MercenariesSelectCategoryProcessor()],
			[MercenariesPersonalHeroesSortEvent.eventName(), new MercenariesPersonalHeroesSortProcessor(this.prefs)],
			[MercenariesHideTeamSummaryEvent.eventName(), new MercenariesHideTeamSummaryProcessor(this.prefs)],
			[MercenariesRestoreTeamSummaryEvent.eventName(), new MercenariesRestoreTeamSummaryProcessor(this.prefs)],
			[
				MercenariesToggleShowHiddenTeamsEvent.eventName(),
				new MercenariesToggleShowHiddenTeamsProcessor(this.prefs),
			],
			[MercenariesAddMercToBackupTeamEvent.eventName(), new MercenariesAddMercToBackupTeamProcessor(this.prefs)],
			[
				MercenariesRemoveMercToBackupTeamEvent.eventName(),
				new MercenariesRemoveMercToBackupTeamProcessor(this.prefs),
			],
			// Stats
			[StatsXpGraphFilterSelectedEvent.eventName(), new StatsXpGraphFilterSelectedProcessor(this.prefs)],
			[ProfileSelectCategoryEvent.eventName(), new ProfileSelectCategoryProcessor()],
		];

		return Map(processors);
	}
}
