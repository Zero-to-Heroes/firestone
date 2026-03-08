import { Inject, Injectable, NgZone, Optional } from '@angular/core';
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
import { AppNavigationService, Events, PreferencesService } from '@firestone/shared/common/service';
import {
	CardsFacadeService,
	ILocalizationService,
	type IWindowHandlerService,
	ProcessingQueue,
	waitForReady,
	WINDOW_HANDLER_SERVICE_TOKEN,
} from '@firestone/shared/framework/core';
import { GameStatsLoaderService } from '@firestone/stats/data-access';
import { Map } from 'immutable';
import { BehaviorSubject, filter } from 'rxjs';
import {
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
	CloseMainWindowEvent,
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
	StatsXpGraphFilterSelectedEvent,
	ToggleShowHiddenDecksEvent,
	TriggerShowMatchStatsEvent,
	UpdateCardSearchResultsEvent,
} from './events';
import { IMainWindowStoreService } from './main-window-store.interface';
import {
	AchievementCompletedProcessor,
	AchievementsFullRefreshProcessor,
	AchievementsRemovePinnedAchievementsEvent,
	AchievementsRemovePinnedAchievementsProcessor,
	AchievementsTrackRandomAchievementsEvent,
	AchievementsTrackRandomAchievementsProcessor,
	BattlegroundsMainWindowSelectBattleProcessor,
	BgsHeroFilterSelectedProcessor,
	BgsHeroSortFilterSelectedProcessor,
	BgsPersonalStatsSelectHeroDetailsProcessor,
	BgsPersonalStatsSelectHeroDetailsWithRemoteInfoProcessor,
	BgsPostMatchStatsComputedProcessor,
	BgsShowStrategiesProcessor,
	ChangeDeckFormatFilterProcessor,
	ChangeDeckModeFilterProcessor,
	ChangeDeckRankCategoryFilterProcessor,
	ChangeDeckRankFilterProcessor,
	ChangeDeckRankGroupProcessor,
	ChangeDeckSortProcessor,
	ChangeDeckTimeFilterProcessor,
	ChangeVisibleAchievementProcessor,
	ChangeVisibleApplicationProcessor,
	CloseMainWindowProcessor,
	CollectionPacksUpdatedProcessor,
	CollectionRefreshPacksProcessor,
	CollectionSelectCurrentTabProcessor,
	ConstructedDeckbuilderClassSelectedProcessor,
	ConstructedDeckbuilderFormatSelectedProcessor,
	ConstructedDeckbuilderGoBackProcessor,
	ConstructedDeckbuilderImportDeckProcessor,
	ConstructedDeckbuilderSaveDeckProcessor,
	ConstructedEjectDeckVersionProcessor,
	ConstructedMetaArchetypeDetailsShowEvent,
	ConstructedMetaArchetypeDetailsShowProcessor,
	ConstructedMetaArchetypeShowDecksEvent,
	ConstructedMetaArchetypeShowDecksProcessor,
	ConstructedMetaDeckDetailsShowEvent,
	ConstructedMetaDeckDetailsShowProcessor,
	ConstructedNewDeckVersionProcessor,
	ConstructedToggleDeckVersionStatsProcessor,
	DecktrackerDeleteDeckProcessor,
	DecktrackerResetDeckStatsProcessor,
	FilterShownAchievementsProcessor,
	GameStatsFullClearProcessor,
	GameStatsFullRefreshProcessor,
	GenericPreferencesUpdateProcessor,
	HideDeckSummaryProcessor,
	MercenariesAddMercToBackupTeamProcessor,
	MercenariesHeroLevelFilterSelectedProcessor,
	MercenariesHeroSelectedProcessor,
	MercenariesHideTeamSummaryProcessor,
	MercenariesModeFilterSelectedProcessor,
	MercenariesPersonalHeroesSortProcessor,
	MercenariesPveDifficultyFilterSelectedProcessor,
	MercenariesRemoveMercToBackupTeamProcessor,
	MercenariesRestoreTeamSummaryProcessor,
	MercenariesRoleFilterSelectedProcessor,
	MercenariesSelectCategoryProcessor,
	MercenariesStarterFilterSelectedProcessor,
	MercenariesToggleShowHiddenTeamsProcessor,
	NavigationBackProcessor,
	NavigationNextProcessor,
	NewPackProcessor,
	NextFtueProcessor,
	PreviousFtueProcessor,
	ProfileSelectCategoryEvent,
	ProfileSelectCategoryProcessor,
	RecomputeGameStatsProcessor,
	RestoreDeckSummaryProcessor,
	SearchCardProcessor,
	SelectAchievementCategoryProcessor,
	SelectBattlegroundsCategoryProcessor,
	SelectCollectionSetProcessor,
	SelectDeckDetailsProcessor,
	SelectDeckViewProcessor,
	ShowAchievementDetailsProcessor,
	ShowCardBackDetailsProcessor,
	ShowCardDetailsProcessor,
	ShowMainWindowProcessor,
	ShowMatchStatsProcessor,
	ShowReplayProcessor,
	ShowReplaysProcessor,
	SkipFtueProcessor,
	StatsXpGraphFilterSelectedProcessor,
	StoreBootstrapService,
	StoreInitProcessor,
	ToggleShowHiddenDecksProcessor,
	TriggerShowMatchStatsProcessor,
	UpdateCardSearchResultsProcessor,
	type Processor,
} from './store/public-api';
import {
	AchievementCompletedEvent,
	ChangeVisibleApplicationEvent,
	MainWindowNavigationService,
	MainWindowState,
	MainWindowStoreEvent,
	NavigationState,
} from './store/store-internal';

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
		@Optional() private readonly ngZone: NgZone,
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
			return eventQueue.slice(1);
		}
		const currentState = this.mainWindowState$$.value;
		const currentNavState = this.navigationState$$.value;
		if (!currentState || !currentNavState) {
			return eventQueue.slice(1);
		}
		try {
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
			const err = e as Error;
			console.error(
				'[store] exception while processing event',
				event.eventName(),
				event,
				err.message,
				err.stack,
				e,
			);
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
