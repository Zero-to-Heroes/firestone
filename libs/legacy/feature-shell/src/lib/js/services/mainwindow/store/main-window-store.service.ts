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
import { BgsPerfectGamesService } from '@firestone/battlegrounds/data-access';
import { BattlegroundsNavigationService, BgsRunStatsService } from '@firestone/battlegrounds/services';
import { BgsSimulatorControllerService } from '@firestone/battlegrounds/simulator';
import { CollectionNavigationService } from '@firestone/collection/common';
import { PackStatsService, SetsService } from '@firestone/collection/data-access';
import { CollectionBootstrapService, CollectionManager, SetsManagerService } from '@firestone/collection/services';
import { ConstructedNavigationService, ConstructedPersonalDecksService } from '@firestone/constructed/common';
import { DecksProviderService } from '@firestone/decktracker/common';
import {
	AchievementCompletedEvent,
	AchievementCompletedProcessor,
	AchievementsFullRefreshEvent,
	AchievementsFullRefreshProcessor,
	AchievementsRemovePinnedAchievementsEvent,
	AchievementsRemovePinnedAchievementsProcessor,
	AchievementsTrackRandomAchievementsEvent,
	AchievementsTrackRandomAchievementsProcessor,
	BattlegroundsMainWindowSelectBattleEvent,
	BattlegroundsMainWindowSelectBattleProcessor,
	BgsHeroFilterSelectedEvent,
	BgsHeroFilterSelectedProcessor,
	BgsHeroSortFilterSelectedEvent,
	BgsHeroSortFilterSelectedProcessor,
	BgsPersonalStatsSelectHeroDetailsEvent,
	BgsPersonalStatsSelectHeroDetailsProcessor,
	BgsPersonalStatsSelectHeroDetailsWithRemoteInfoEvent,
	BgsPersonalStatsSelectHeroDetailsWithRemoteInfoProcessor,
	BgsPostMatchStatsComputedEvent,
	BgsPostMatchStatsComputedProcessor,
	BgsShowStrategiesEvent,
	BgsShowStrategiesProcessor,
	ChangeDeckFormatFilterEvent,
	ChangeDeckFormatFilterProcessor,
	ChangeDeckModeFilterEvent,
	ChangeDeckModeFilterProcessor,
	ChangeDeckRankCategoryFilterEvent,
	ChangeDeckRankCategoryFilterProcessor,
	ChangeDeckRankFilterEvent,
	ChangeDeckRankFilterProcessor,
	ChangeDeckRankGroupEvent,
	ChangeDeckRankGroupProcessor,
	ChangeDeckSortEvent,
	ChangeDeckSortProcessor,
	ChangeDeckTimeFilterEvent,
	ChangeDeckTimeFilterProcessor,
	ChangeVisibleAchievementEvent,
	ChangeVisibleAchievementProcessor,
	ChangeVisibleApplicationEvent,
	ChangeVisibleApplicationProcessor,
	CloseMainWindowEvent,
	CloseMainWindowProcessor,
	CollectionPacksUpdatedEvent,
	CollectionPacksUpdatedProcessor,
	CollectionRefreshPacksEvent,
	CollectionRefreshPacksProcessor,
	CollectionSelectCurrentTabEvent,
	CollectionSelectCurrentTabProcessor,
	ConstructedDeckbuilderClassSelectedEvent,
	ConstructedDeckbuilderClassSelectedProcessor,
	ConstructedDeckbuilderFormatSelectedEvent,
	ConstructedDeckbuilderFormatSelectedProcessor,
	ConstructedDeckbuilderGoBackEvent,
	ConstructedDeckbuilderGoBackProcessor,
	ConstructedDeckbuilderImportDeckEvent,
	ConstructedDeckbuilderImportDeckProcessor,
	ConstructedDeckbuilderSaveDeckEvent,
	ConstructedDeckbuilderSaveDeckProcessor,
	ConstructedEjectDeckVersionEvent,
	ConstructedEjectDeckVersionProcessor,
	ConstructedMetaArchetypeDetailsShowEvent,
	ConstructedMetaArchetypeDetailsShowProcessor,
	ConstructedMetaArchetypeShowDecksEvent,
	ConstructedMetaArchetypeShowDecksProcessor,
	ConstructedMetaDeckDetailsShowEvent,
	ConstructedMetaDeckDetailsShowProcessor,
	ConstructedNewDeckVersionEvent,
	ConstructedNewDeckVersionProcessor,
	ConstructedToggleDeckVersionStatsEvent,
	ConstructedToggleDeckVersionStatsProcessor,
	DecktrackerDeleteDeckEvent,
	DecktrackerDeleteDeckProcessor,
	DecktrackerResetDeckStatsEvent,
	DecktrackerResetDeckStatsProcessor,
	FilterShownAchievementsEvent,
	FilterShownAchievementsProcessor,
	GamesFullClearEvent,
	GamesFullRefreshEvent,
	GameStatsFullClearProcessor,
	GameStatsFullRefreshProcessor,
	GenericPreferencesUpdateEvent,
	GenericPreferencesUpdateProcessor,
	HideDeckSummaryEvent,
	HideDeckSummaryProcessor,
	IMainWindowStoreService,
	MainWindowNavigationService,
	MainWindowState,
	MainWindowStoreEvent,
	MercenariesAddMercToBackupTeamEvent,
	MercenariesAddMercToBackupTeamProcessor,
	MercenariesHeroLevelFilterSelectedEvent,
	MercenariesHeroLevelFilterSelectedProcessor,
	MercenariesHeroSelectedEvent,
	MercenariesHeroSelectedProcessor,
	MercenariesHideTeamSummaryEvent,
	MercenariesHideTeamSummaryProcessor,
	MercenariesModeFilterSelectedEvent,
	MercenariesModeFilterSelectedProcessor,
	MercenariesPersonalHeroesSortEvent,
	MercenariesPersonalHeroesSortProcessor,
	MercenariesPveDifficultyFilterSelectedEvent,
	MercenariesPveDifficultyFilterSelectedProcessor,
	MercenariesRemoveMercToBackupTeamEvent,
	MercenariesRemoveMercToBackupTeamProcessor,
	MercenariesRestoreTeamSummaryEvent,
	MercenariesRestoreTeamSummaryProcessor,
	MercenariesRoleFilterSelectedEvent,
	MercenariesRoleFilterSelectedProcessor,
	MercenariesSelectCategoryEvent,
	MercenariesSelectCategoryProcessor,
	MercenariesStarterFilterSelectedEvent,
	MercenariesStarterFilterSelectedProcessor,
	MercenariesToggleShowHiddenTeamsEvent,
	MercenariesToggleShowHiddenTeamsProcessor,
	NavigationBackEvent,
	NavigationBackProcessor,
	NavigationNextEvent,
	NavigationNextProcessor,
	NavigationState,
	NewPackEvent,
	NewPackProcessor,
	NextFtueEvent,
	NextFtueProcessor,
	PreviousFtueEvent,
	PreviousFtueProcessor,
	ProfileSelectCategoryEvent,
	ProfileSelectCategoryProcessor,
	RecomputeGameStatsEvent,
	RecomputeGameStatsProcessor,
	RestoreDeckSummaryEvent,
	RestoreDeckSummaryProcessor,
	SearchCardProcessor,
	SearchCardsEvent,
	SelectAchievementCategoryEvent,
	SelectAchievementCategoryProcessor,
	SelectBattlegroundsCategoryEvent,
	SelectBattlegroundsCategoryProcessor,
	SelectCollectionSetEvent,
	SelectCollectionSetProcessor,
	SelectDeckDetailsEvent,
	SelectDeckDetailsProcessor,
	SelectDecksViewEvent,
	SelectDeckViewProcessor,
	ShowAchievementDetailsEvent,
	ShowAchievementDetailsProcessor,
	ShowCardBackDetailsEvent,
	ShowCardBackDetailsProcessor,
	ShowCardDetailsEvent,
	ShowCardDetailsProcessor,
	ShowMainWindowEvent,
	ShowMainWindowProcessor,
	ShowMatchStatsEvent,
	ShowMatchStatsProcessor,
	ShowReplayEvent,
	ShowReplayProcessor,
	ShowReplaysEvent,
	ShowReplaysProcessor,
	SkipFtueEvent,
	SkipFtueProcessor,
	StatsXpGraphFilterSelectedEvent,
	StatsXpGraphFilterSelectedProcessor,
	StoreBootstrapService,
	StoreInitProcessor,
	ToggleShowHiddenDecksEvent,
	ToggleShowHiddenDecksProcessor,
	TriggerShowMatchStatsEvent,
	TriggerShowMatchStatsProcessor,
	UpdateCardSearchResultsEvent,
	UpdateCardSearchResultsProcessor,
	type Processor,
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
import { Map } from 'immutable';
import { BehaviorSubject, filter } from 'rxjs';

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
		this.navigationState$$.next(navState ?? new NavigationState());
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
		const processor = this.processors.get(event.eventName());
		if (!processor) {
			console.error('[store] missing processor for event', event.eventName());
			return;
		}
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
			[NextFtueEvent.eventName(), new NextFtueProcessor(this.prefs, this.mainNavigation)],
			[PreviousFtueEvent.eventName(), new PreviousFtueProcessor(this.mainNavigation)],
			[SkipFtueEvent.eventName(), new SkipFtueProcessor(this.prefs, this.mainNavigation)],
			[RecomputeGameStatsEvent.eventName(), new RecomputeGameStatsProcessor(this.gameStats)],
			[GamesFullRefreshEvent.eventName(), new GameStatsFullRefreshProcessor(this.gameStatsLoader)],
			[GamesFullClearEvent.eventName(), new GameStatsFullClearProcessor(this.gameStatsLoader)],
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
			[SelectDecksViewEvent.eventName(), new SelectDeckViewProcessor(this.constructedNavigation)],
			[
				SelectDeckDetailsEvent.eventName(),
				new SelectDeckDetailsProcessor(this.decksProvider, this.mainNavigation, this.constructedNavigation),
			],
			[ChangeDeckFormatFilterEvent.eventName(), new ChangeDeckFormatFilterProcessor(this.prefs)],
			[ChangeDeckRankFilterEvent.eventName(), new ChangeDeckRankFilterProcessor(this.prefs)],
			[ChangeDeckRankGroupEvent.eventName(), new ChangeDeckRankGroupProcessor(this.prefs)],
			[ChangeDeckRankCategoryFilterEvent.eventName(), new ChangeDeckRankCategoryFilterProcessor(this.prefs)],
			[ChangeDeckModeFilterEvent.eventName(), new ChangeDeckModeFilterProcessor()],
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
			[
				SelectBattlegroundsCategoryEvent.eventName(),
				new SelectBattlegroundsCategoryProcessor(this.battlegroundsNavigation, this.mainNavigation),
			],
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
			[StatsXpGraphFilterSelectedEvent.eventName(), new StatsXpGraphFilterSelectedProcessor(this.prefs)],
			[ProfileSelectCategoryEvent.eventName(), new ProfileSelectCategoryProcessor()],
		];

		return Map(processors);
	}
}
