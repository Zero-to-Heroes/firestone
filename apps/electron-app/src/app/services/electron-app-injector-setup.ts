import { NgZone } from '@angular/core';
import {
	AchievementHistoryService,
	AchievementHistoryStorageService,
	AchievementsLiveProgressTrackingService,
	AchievementsLiveTrackingFacadeService,
	AchievementsMemoryMonitor,
	AchievementsNavigationService,
	AchievementsNotificationService,
	AchievementsStateManagerService,
	AchievementsStorageService,
	FirestoneRemoteAchievementsLoaderService,
	RawAchievementsLoaderService,
} from '@firestone/achievements/common';
import { AchievementsRefLoaderService } from '@firestone/achievements/data-access';
import {
	APP_VERSION_SERVICE_TOKEN,
	EndGameListenerService,
	EndGameUploaderService,
	GameNativeStateStoreService,
	GameParserService,
	LocalizationLoaderWithCache,
	QuestsService,
	ReplayUploadService,
	RewardMonitorService,
} from '@firestone/app/common';
import {
	ArenaCardStatsService,
	ArenaClassStatsService,
	ArenaDeckStatsService,
	ArenaDraftManagerService,
	ArenaHighWinsRunsService,
	ArenaInfoService,
	ArenaMetaHeroStrategiesService,
	ArenaMulliganGuideService,
	ArenaNavigationService,
	ArenaRewardsService,
	ArenaRunsService,
	ArenDeckDetailsService,
} from '@firestone/arena/common';
import { ArenaRefService } from '@firestone/arena/data-access';
import {
	BgsBattleSimulationService,
	BgsIntermediateResultsSimGuardianService,
	CompositionDetectorService,
} from '@firestone/battlegrounds/core';
import { BgsMetaHeroStatsAccessService, BgsPerfectGamesService } from '@firestone/battlegrounds/data-access';
import {
	BattlegroundsCardsService,
	BattlegroundsCompsService,
	BattlegroundsNavigationService,
	BattlegroundsQuestsService,
	BattlegroundsTrinketsService,
	BGS_RUN_STATS_EVENT_HANDLER,
	BgsBoardHighlighterService,
	BgsInGameHeroSelectionGuardianService,
	BgsInGameQuestsGuardianService,
	BgsInGameQuestsService,
	BgsInGameTimewarpedGuardianService,
	BgsInGameTimewarpedService,
	BgsInGameTrinketsGuardianService,
	BgsInGameTrinketsService,
	BgsInGameWindowNavigationService,
	BgsMetaCompositionStrategiesService,
	BgsMetaHeroStatsDuoService,
	BgsMetaHeroStatsService,
	BgsMetaHeroStrategiesService,
	BgsPlayerHeroStatsService,
	BgsRunStatsService,
} from '@firestone/battlegrounds/services';
import { BgsSimulatorControllerService, StateManagerService } from '@firestone/battlegrounds/simulator';
import { CollectionNavigationService } from '@firestone/collection/common';
import { PackStatsService, SetsService } from '@firestone/collection/data-access';
import {
	CollectionBootstrapService,
	CollectionManager,
	CollectionStorageService,
	SetsManagerService,
} from '@firestone/collection/services';
import {
	ConstructedConfigService,
	ConstructedMetaDecksStateService,
	ConstructedMulliganGuideGuardianService,
	ConstructedMulliganGuideService,
	ConstructedNavigationService,
	ConstructedPersonalDecksService,
} from '@firestone/constructed/common';
import { DecksProviderService } from '@firestone/decktracker/common';
import {
	ElectronApiRunner,
	ElectronStorageService,
	ElectronSubscriptionService,
	StandaloneUserService,
} from '@firestone/electron/common';
import {
	ElectronClipboardFacadeService,
	ElectronFileSystemUIFacadeService,
	ElectronHotkeyHandlerFacadeService,
	ElectronMonitorsFacadeService,
	ElectronRegionInfoFacadeService,
	ElectronScreenshotFacadeService,
	ElectronSystemInfoFacadeService,
	ElectronWindowControlsFacadeService,
} from '@firestone/electron/view';
import {
	AiDeckService,
	BattlegroundsOfficialLeaderboardService,
	BgsMatchMemoryInfoService,
	BgsMatchPlayersMmrService,
	CardsHighlightFacadeService,
	CardsHighlightService,
	ConstructedArchetypeService,
	ConstructedArchetypeServiceOrchestrator,
	DeckHandlerService,
	DeckManipulationHelper,
	DeckParserFacadeService,
	DeckParserService,
	GameEvents,
	GameEventsEmitterService,
	GameEventsFacadeService,
	GameModeDataService,
	GameStateFacadeService,
	GameStateMetaInfoService,
	GameStateParsersService,
	GameStateService,
	GameUniqueIdService,
	OverlayDisplayService,
	RealTimeStatsParsersService,
	RealTimeStatsService,
	REVIEW_ID_SERVICE_TOKEN,
	ReviewIdService,
	SecretConfigService,
	SecretsParserService,
} from '@firestone/game-state';
import { LotteryFacadeService, LotteryService, LotteryWidgetControllerService } from '@firestone/lottery/common';
import {
	BgsRunStatsEventHandlerService,
	MAIN_WINDOW_STORE_SERVICE_TOKEN,
	MainWindowNavigationService,
	MainWindowStateFacadeService,
	MainWindowStoreService,
	StoreBootstrapService,
} from '@firestone/mainwindow/common';
import {
	BgsSceneService,
	CardChoicesService,
	CardMousedOverService,
	MemoryInspectionService,
	MemoryUpdatesService,
	MindVisionFacadeService,
	MindVisionStateMachineService,
	SceneService,
} from '@firestone/memory';
import {
	MercenariesBattleStateFacadeService,
	MercenariesBattleStateService,
	MercenariesMemoryCacheService,
	MercenariesOutOfCombatFacadeService,
	MercenariesOutOfCombatService,
	MercenariesReferenceDataService,
} from '@firestone/mercenaries/common';
import { InGameReplayService, ModsManagerService } from '@firestone/mods/common';
import { ProfileServiceFacade, ProfileUploaderService } from '@firestone/profile/common';
import { AccountService } from '@firestone/profile/services';
import { CustomAppearanceService, SettingsControllerService } from '@firestone/settings/services';
import {
	AppNavigationService,
	BugReportService,
	DiskCacheService,
	Events,
	ExpertContributorsService,
	GameStatusService,
	GlobalErrorService,
	LOG_FILE_BACKEND,
	LogListenerCacheService,
	LogListenerService,
	LogsUploaderService,
	LogUtilsService,
	NotificationsService,
	PatchesConfigService,
	PowerLogBufferService,
	PreferencesService,
	PreferencesStorageService,
	S3FileUploadService,
	StandaloneAdService,
	SubscriptionService,
	TebexHeadlessService,
	TebexService,
} from '@firestone/shared/common/service';
import {
	ACCOUNT_SERVICE_TOKEN,
	ADS_SERVICE_TOKEN,
	ApiRunner,
	CardRulesService,
	CardsFacadeService,
	CardsFacadeStandaloneService,
	CLIPBOARD_SERVICE_TOKEN,
	DATABASE_SERVICE_TOKEN,
	ELECTRON_HOTKEY_HANDLER_IMPL_TOKEN,
	EXTERNAL_URL_SERVICE_TOKEN,
	FILE_SYSTEM_UI_SERVICE_TOKEN,
	HOTKEY_HANDLER_SERVICE_TOKEN,
	HotkeyFacadeService,
	IAdsService,
	IDatabaseService,
	IHotkeyHandlerService,
	ILocalizationService,
	LocalizationStandaloneService,
	LocalStorageService,
	MONITORS_SERVICE_TOKEN,
	OverwolfService,
	OW_UTILS_SERVICE_TOKEN,
	OwUtilsService,
	REGION_INFO_SERVICE_TOKEN,
	SCREENSHOT_SERVICE_TOKEN,
	setAppInjector,
	SYSTEM_INFO_SERVICE_TOKEN,
	USER_SERVICE_TOKEN,
	UserService,
	WINDOW_CONTROLS_SERVICE_TOKEN,
	WINDOW_HANDLER_SERVICE_TOKEN,
	WindowHandlerFacadeService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { GameStatsLoaderService } from '@firestone/stats/data-access';
import {
	GAME_STATS_PROVIDER_SERVICE_TOKEN,
	GameStatsProviderService,
	GlobalStatsService,
	MatchAnalysisService,
	ReplayMetadataBuilderService,
} from '@firestone/stats/services';
import { TavernBrawlService } from '@firestone/tavern-brawl/common';
import { LiveStreamsService } from '@firestone/twitch/common';
import {
	FakeMissingTranslationHandler,
	TranslateDefaultParser,
	TranslateFakeCompiler,
	TranslateService,
	TranslateStore,
} from '@ngx-translate/core';
import { InternalProfileAchievementsService } from 'libs/profile/common/src/lib/services/internal/internal-profile-achievements.service';
import { InternalProfileBattlegroundsService } from 'libs/profile/common/src/lib/services/internal/internal-profile-battlegrounds.service';
import { InternalProfileCollectionService } from 'libs/profile/common/src/lib/services/internal/internal-profile-collection.service';
import { InternalProfileInfoService } from 'libs/profile/common/src/lib/services/internal/internal-profile-info.service';
import { BgsBattleSimulationWorkerService } from './bgs-battle-simulation-worker.service';
import { ElectronAngularInjector } from './electron-angular-injector';
import { ElectronAppVersionService } from './electron-app-version.service';
import { ElectronDiskCacheService } from './electron-disk-cache.service';
import { ElectronExternalUrlService } from './electron-external-url.service';
import { ElectronHotkeyHandlerService } from './electron-hotkey-handler.service';
import { ElectronLogFileBackendService } from './electron-log-file-backend.service';
import { ElectronLogsUploaderService } from './electron-logs-uploader.service';
import { ElectronWindowHandlerService } from './electron-window-handler.service';
import { LowLevelUtilsElectronService } from './low-level-utils-electron.service';
import { MindVisionElectronService } from './mind-vision-electron.service';
import { SqliteDatabaseService } from './sqlite-database.service';

export const buildAppInjector = () => {
	const electronInjector = new ElectronAngularInjector();
	setAppInjector(electronInjector);

	const ow: OverwolfService = null;

	// Create and register services with the injector
	// FIXME: this instantiate everything, while we might want to have lazy loading
	const allCardsRaw = new CardsFacadeStandaloneService();
	const allCards: CardsFacadeService = allCardsRaw as any as CardsFacadeService;
	electronInjector.register(CardsFacadeStandaloneService, allCardsRaw);
	electronInjector.register(CardsFacadeService, allCards);

	// Stub for facades that need WindowManagerService before it exists (breaks circular dep)
	const stubWindowManager = {
		isMainWindow: () => Promise.resolve(true),
		getMainWindow: () => Promise.reject(new Error('Not used in Electron main')),
	} as any as WindowManagerService;

	const electronMonitorsFacade = new ElectronMonitorsFacadeService(stubWindowManager);
	electronInjector.register(MONITORS_SERVICE_TOKEN, electronMonitorsFacade);
	electronInjector.register(ElectronMonitorsFacadeService, electronMonitorsFacade);

	const windowManager = new WindowManagerService(ow, electronInjector);
	electronInjector.register(WindowManagerService, windowManager);

	const electronWindowHandler = new ElectronWindowHandlerService();
	electronInjector.register(WINDOW_HANDLER_SERVICE_TOKEN, electronWindowHandler);
	electronInjector.register(ElectronWindowHandlerService, electronWindowHandler);

	const externalUrlService = new ElectronExternalUrlService();
	electronInjector.register(EXTERNAL_URL_SERVICE_TOKEN, externalUrlService);

	const electronClipboardFacade = new ElectronClipboardFacadeService(windowManager);
	electronInjector.register(CLIPBOARD_SERVICE_TOKEN, electronClipboardFacade);
	electronInjector.register(ElectronClipboardFacadeService, electronClipboardFacade);

	const electronFileSystemUIFacade = new ElectronFileSystemUIFacadeService(windowManager);
	electronInjector.register(FILE_SYSTEM_UI_SERVICE_TOKEN, electronFileSystemUIFacade);
	electronInjector.register(ElectronFileSystemUIFacadeService, electronFileSystemUIFacade);

	const electronSystemInfoFacade = new ElectronSystemInfoFacadeService(windowManager);
	electronInjector.register(SYSTEM_INFO_SERVICE_TOKEN, electronSystemInfoFacade);
	electronInjector.register(ElectronSystemInfoFacadeService, electronSystemInfoFacade);

	const electronRegionInfoFacade = new ElectronRegionInfoFacadeService(windowManager);
	electronInjector.register(REGION_INFO_SERVICE_TOKEN, electronRegionInfoFacade);
	electronInjector.register(ElectronRegionInfoFacadeService, electronRegionInfoFacade);

	const electronWindowControlsFacade = new ElectronWindowControlsFacadeService(windowManager);
	electronInjector.register(WINDOW_CONTROLS_SERVICE_TOKEN, electronWindowControlsFacade);
	electronInjector.register(ElectronWindowControlsFacadeService, electronWindowControlsFacade);

	const electronScreenshotFacade = new ElectronScreenshotFacadeService(windowManager);
	electronInjector.register(SCREENSHOT_SERVICE_TOKEN, electronScreenshotFacade);
	electronInjector.register(ElectronScreenshotFacadeService, electronScreenshotFacade);

	const gameStatus = new GameStatusService(windowManager);
	electronInjector.register(GameStatusService, gameStatus);

	const preferences = new PreferencesService(windowManager);
	electronInjector.register(PreferencesService, preferences);

	const electronHotkeyHandler = new ElectronHotkeyHandlerService();
	electronInjector.register(ElectronHotkeyHandlerService, electronHotkeyHandler);
	electronInjector.register(ELECTRON_HOTKEY_HANDLER_IMPL_TOKEN, electronHotkeyHandler);

	const electronHotkeyHandlerFacade = new ElectronHotkeyHandlerFacadeService(windowManager);
	electronInjector.register(
		HOTKEY_HANDLER_SERVICE_TOKEN,
		electronHotkeyHandlerFacade as any as IHotkeyHandlerService,
	);
	electronInjector.register(ElectronHotkeyHandlerFacadeService, electronHotkeyHandlerFacade);

	const diskCache: DiskCacheService = new ElectronDiskCacheService(preferences) as any as DiskCacheService;
	electronInjector.register(DiskCacheService, diskCache);
	electronInjector.register(ElectronDiskCacheService, diskCache as any as ElectronDiskCacheService);

	const logFileBackend = new ElectronLogFileBackendService(diskCache as any as ElectronDiskCacheService);
	electronInjector.register(LOG_FILE_BACKEND, logFileBackend);

	const s3FileUpload = new S3FileUploadService();
	electronInjector.register(S3FileUploadService, s3FileUpload);

	const logsUploader = new ElectronLogsUploaderService(
		logFileBackend,
		diskCache as any as ElectronDiskCacheService,
		s3FileUpload,
		preferences,
	) as any as LogsUploaderService;
	electronInjector.register(LogsUploaderService, logsUploader);

	const logUtils = new LogUtilsService(logFileBackend, preferences, gameStatus);
	electronInjector.register(LogUtilsService, logUtils);

	const logListenerCache = new LogListenerCacheService();
	electronInjector.register(LogListenerCacheService, logListenerCache);

	const logListener = new LogListenerService(logFileBackend, gameStatus, preferences, logUtils, logListenerCache);
	electronInjector.register(LogListenerService, logListener);

	const localStorage = new ElectronStorageService();
	electronInjector.register(LocalStorageService, localStorage);

	const sqliteDb = new SqliteDatabaseService();
	electronInjector.register(DATABASE_SERVICE_TOKEN, sqliteDb as IDatabaseService);

	const api: ApiRunner = new ElectronApiRunner() as any as ApiRunner;
	electronInjector.register(ApiRunner, api);

	const preferencesStorage = new PreferencesStorageService(localStorage);
	electronInjector.register(PreferencesStorageService, preferencesStorage);

	const memoryUpdates = new MemoryUpdatesService(windowManager);
	electronInjector.register(MemoryUpdatesService, memoryUpdates);

	const mindVisionFacade = new MindVisionElectronService(memoryUpdates);
	electronInjector.register(MindVisionElectronService, mindVisionFacade);

	const mindVisionStateMachine = new MindVisionStateMachineService(
		mindVisionFacade as any as MindVisionFacadeService,
		gameStatus,
		memoryUpdates,
		null,
	);
	electronInjector.register(MindVisionStateMachineService, mindVisionStateMachine);

	const memoryInspection = new MemoryInspectionService(
		gameStatus,
		mindVisionFacade as any as MindVisionFacadeService,
		mindVisionStateMachine,
	);
	electronInjector.register(MemoryInspectionService, memoryInspection);

	const scene = new SceneService(windowManager);
	electronInjector.register(SceneService, scene);

	const gameEventsEmitter = new GameEventsEmitterService();
	electronInjector.register(GameEventsEmitterService, gameEventsEmitter);

	const deckHandler = new DeckHandlerService(allCards);
	electronInjector.register(DeckHandlerService, deckHandler);

	const deckParser = new DeckParserService(
		gameEventsEmitter,
		memoryUpdates,
		memoryInspection,
		allCards,
		null, // FIXME: replace OW service with something else
		deckHandler,
		api as any as ApiRunner,
		preferences,
		gameStatus,
		scene,
		logFileBackend,
	);
	electronInjector.register(DeckParserService, deckParser);

	const deckParserFacade = new DeckParserFacadeService(windowManager);
	electronInjector.register(DeckParserFacadeService, deckParserFacade);

	const overlayDisplay = new OverlayDisplayService(windowManager);
	electronInjector.register(OverlayDisplayService, overlayDisplay);

	const gameStateFacade = new GameStateFacadeService(windowManager);
	electronInjector.register(GameStateFacadeService, gameStateFacade);

	const gameId = new GameUniqueIdService(memoryInspection);
	electronInjector.register(GameUniqueIdService, gameId);

	const reviewId = new ReviewIdService(gameEventsEmitter);
	electronInjector.register(ReviewIdService, reviewId);
	electronInjector.register(REVIEW_ID_SERVICE_TOKEN, reviewId);

	const gameEventsFacade = new GameEventsFacadeService();
	electronInjector.register(GameEventsFacadeService, gameEventsFacade);

	const zone = null;

	const notifications = new NotificationsService(windowManager);
	electronInjector.register(NotificationsService, notifications);

	// Translation service
	const translateLoader = new LocalizationLoaderWithCache(
		diskCache as any as DiskCacheService,
		api as any as ApiRunner,
	);
	// Create TranslateService dependencies
	const translateStore = new TranslateStore();
	const translateParser = new TranslateDefaultParser();
	const translateCompiler = new TranslateFakeCompiler();
	const missingTranslationHandler = new FakeMissingTranslationHandler();
	// Create TranslateService instance
	const translate = new TranslateService(
		translateStore,
		translateLoader,
		translateCompiler,
		translateParser,
		missingTranslationHandler,
		true, // useDefaultLang
		false, // isolate
		false, // extend
		'enUS', // defaultLanguage
	);
	// Initialize the service
	translate.setDefaultLang('enUS');
	electronInjector.register(TranslateService, translate);

	const i18n = new LocalizationStandaloneService(allCardsRaw, translate);
	electronInjector.register(LocalizationStandaloneService, i18n);
	electronInjector.register(ILocalizationService, i18n);

	const globalError = new GlobalErrorService(notifications, i18n, gameStatus, externalUrlService);

	const powerLogBuffer = new PowerLogBufferService();
	electronInjector.register(PowerLogBufferService, powerLogBuffer);

	const gameEvents = new GameEvents(
		gameEventsEmitter,
		scene,
		gameStatus,
		allCards,
		gameStateFacade,
		gameId,
		gameEventsFacade,
		globalError,
		powerLogBuffer,
		zone,
	);
	electronInjector.register(GameEvents, gameEvents);

	const gameStateMetaInfos = new GameStateMetaInfoService();
	electronInjector.register(GameStateMetaInfoService, gameStateMetaInfos);

	const helper = new DeckManipulationHelper(allCards, i18n);
	electronInjector.register(DeckManipulationHelper, helper);

	const secretsParser = new SecretsParserService(helper, allCards);
	electronInjector.register(SecretsParserService, secretsParser);

	const aiDecks = new AiDeckService(api as any as ApiRunner);
	electronInjector.register(AiDeckService, aiDecks);

	const secretsConfig = new SecretConfigService(api as any as ApiRunner, allCards);
	electronInjector.register(SecretConfigService, secretsConfig);

	const patchesConfig = new PatchesConfigService(windowManager);
	electronInjector.register(PatchesConfigService, patchesConfig);

	const bgsBoardHighlighter = new BgsBoardHighlighterService(windowManager);
	electronInjector.register(BgsBoardHighlighterService, bgsBoardHighlighter);

	const bgsInGameHeroSelectionGuardian = new BgsInGameHeroSelectionGuardianService(windowManager);
	electronInjector.register(BgsInGameHeroSelectionGuardianService, bgsInGameHeroSelectionGuardian);

	const bgsInGameQuests = new BgsInGameQuestsService(windowManager);
	electronInjector.register(BgsInGameQuestsService, bgsInGameQuests);

	const bgsInGameQuestsGuardian = new BgsInGameQuestsGuardianService(windowManager);
	electronInjector.register(BgsInGameQuestsGuardianService, bgsInGameQuestsGuardian);

	const bgsInGameTrinkets = new BgsInGameTrinketsService(windowManager);
	electronInjector.register(BgsInGameTrinketsService, bgsInGameTrinkets);

	const bgsInGameTrinketsGuardian = new BgsInGameTrinketsGuardianService(windowManager);
	electronInjector.register(BgsInGameTrinketsGuardianService, bgsInGameTrinketsGuardian);

	const bgsQuests = new BattlegroundsQuestsService(windowManager);
	electronInjector.register(BattlegroundsQuestsService, bgsQuests);

	const cardChoices = new CardChoicesService(windowManager);
	electronInjector.register(CardChoicesService, cardChoices);

	const constructedMetaDecksState = new ConstructedMetaDecksStateService(windowManager);
	electronInjector.register(ConstructedMetaDecksStateService, constructedMetaDecksState);

	const constructedArchetypeService = new ConstructedArchetypeService(api as any as ApiRunner, allCards);
	electronInjector.register(ConstructedArchetypeService, constructedArchetypeService);

	const constructedMulliganGuide = new ConstructedMulliganGuideService(windowManager);
	electronInjector.register(ConstructedMulliganGuideService, constructedMulliganGuide);

	const constructedArchetypes = new ConstructedArchetypeService(api as any as ApiRunner, allCards);
	electronInjector.register(ConstructedArchetypeService, constructedArchetypes);

	const gameStatsLoader = new GameStatsLoaderService(windowManager);
	electronInjector.register(GameStatsLoaderService, gameStatsLoader);

	const constructedArchetypesOthestrator = new ConstructedArchetypeServiceOrchestrator(
		constructedArchetypes,
		gameEventsEmitter,
	);
	electronInjector.register(ConstructedArchetypeServiceOrchestrator, constructedArchetypesOthestrator);

	const arenaDraftManager = new ArenaDraftManagerService(windowManager);
	electronInjector.register(ArenaDraftManagerService, arenaDraftManager);

	const arenaMulliganGuide = new ArenaMulliganGuideService(windowManager);
	electronInjector.register(ArenaMulliganGuideService, arenaMulliganGuide);

	const gameNativeStateStore = new GameNativeStateStoreService(windowManager);
	electronInjector.register(GameNativeStateStoreService, gameNativeStateStore);

	const cardMousedOver = new CardMousedOverService(windowManager);
	electronInjector.register(CardMousedOverService, cardMousedOver);

	const ads: IAdsService = new StandaloneAdService(windowManager);
	electronInjector.register(ADS_SERVICE_TOKEN, ads);

	const tebexService = new TebexHeadlessService(windowManager);
	electronInjector.register(TebexHeadlessService, tebexService);
	electronInjector.register(TebexService, tebexService as any as TebexService);

	const subscriptionService = new ElectronSubscriptionService(windowManager);
	electronInjector.register(ElectronSubscriptionService, subscriptionService);
	electronInjector.register(SubscriptionService, subscriptionService as any as SubscriptionService);

	const userService = new StandaloneUserService(windowManager) as any as UserService;
	electronInjector.register(StandaloneUserService, userService as any as StandaloneUserService);
	electronInjector.register(UserService, userService);
	electronInjector.register(USER_SERVICE_TOKEN, userService);

	const bugReportService = new BugReportService(logsUploader, userService, api as any as ApiRunner, ads);
	electronInjector.register(BugReportService, bugReportService);

	const bgsOfficialLeaderboard = new BattlegroundsOfficialLeaderboardService(windowManager);
	electronInjector.register(BattlegroundsOfficialLeaderboardService, bgsOfficialLeaderboard);

	const battleExecutor = new BgsBattleSimulationWorkerService(allCards);
	const simulation = new BgsBattleSimulationService(
		api as any as ApiRunner,
		allCards,
		battleExecutor,
		ads,
		bugReportService,
		preferences,
		null, // BgsIntermediateResultsSimGuardianService
	);
	electronInjector.register(BgsBattleSimulationService, simulation);

	const owUtils = new LowLevelUtilsElectronService();
	electronInjector.register(OW_UTILS_SERVICE_TOKEN, owUtils);
	electronInjector.register(OwUtilsService, owUtils as any as OwUtilsService);

	const arenaRefService = new ArenaRefService(windowManager);
	electronInjector.register(ArenaRefService, arenaRefService);

	const gameEventsParser = new GameStateParsersService(
		helper,
		allCards,
		i18n,
		aiDecks,
		deckHandler,
		memoryInspection,
		owUtils,
		preferences,
		deckParser,
		secretsConfig,
		constructedArchetypesOthestrator,
		gameEventsEmitter,
		bugReportService,
		logsUploader,
		simulation,
		ads,
		gameId,
		null, // BgsIntermediateResultsSimGuardianService
		reviewId,
		arenaRefService,
	);

	const bgsMatchPlayers = new BgsMatchPlayersMmrService(windowManager);
	electronInjector.register(BgsMatchPlayersMmrService, bgsMatchPlayers);

	const bgsMatchMemoryInfo = new BgsMatchMemoryInfoService(
		memoryInspection,
		gameStatus,
		preferences,
		bgsMatchPlayers,
	);
	electronInjector.register(BgsMatchMemoryInfoService, bgsMatchMemoryInfo);

	const realTimeParsers = new RealTimeStatsParsersService(allCards);
	electronInjector.register(RealTimeStatsParsersService, realTimeParsers);

	const realTimeStats = new RealTimeStatsService(gameEventsEmitter, scene, realTimeParsers, zone);
	electronInjector.register(RealTimeStatsService, realTimeStats);

	const gameState = new GameStateService(
		gameEventsEmitter,
		gameStateMetaInfos,
		preferences,
		ow,
		secretsParser,
		gameEventsParser,
		overlayDisplay,
		bgsMatchMemoryInfo,
		realTimeStats,
		simulation,
		zone,
	);
	electronInjector.register(GameStateService, gameState);

	const constructedMulliganGuardian = new ConstructedMulliganGuideGuardianService(windowManager);
	electronInjector.register(ConstructedMulliganGuideGuardianService, constructedMulliganGuardian);

	const constructedNavigation = new ConstructedNavigationService(windowManager);
	electronInjector.register(ConstructedNavigationService, constructedNavigation);

	const bgsTrinkets = new BattlegroundsTrinketsService(windowManager);
	electronInjector.register(BattlegroundsTrinketsService, bgsTrinkets);

	const arenaCardStats = new ArenaCardStatsService(windowManager);
	electronInjector.register(ArenaCardStatsService, arenaCardStats);

	const cardsHighlight = new CardsHighlightService(allCards, preferences, gameStateFacade, cardMousedOver);
	electronInjector.register(CardsHighlightService, cardsHighlight);

	const cardsHighlightFacade = new CardsHighlightFacadeService(cardsHighlight);
	electronInjector.register(CardsHighlightFacadeService, cardsHighlightFacade);

	const arenaClassStats = new ArenaClassStatsService(windowManager);
	electronInjector.register(ArenaClassStatsService, arenaClassStats);

	const arenaDeckStats = new ArenaDeckStatsService(windowManager);
	electronInjector.register(ArenaDeckStatsService, arenaDeckStats);

	const accountService = new AccountService(windowManager);
	electronInjector.register(AccountService, accountService);
	electronInjector.register(ACCOUNT_SERVICE_TOKEN, accountService);

	const questService = new QuestsService(windowManager);
	electronInjector.register(QuestsService, questService);

	const cardRules = new CardRulesService(windowManager);
	electronInjector.register(CardRulesService, cardRules);

	const bgsMetaCompositionStrategies = new BgsMetaCompositionStrategiesService(windowManager);
	electronInjector.register(BgsMetaCompositionStrategiesService, bgsMetaCompositionStrategies);

	const appVersion = new ElectronAppVersionService();
	electronInjector.register(APP_VERSION_SERVICE_TOKEN, appVersion);

	const matchAnalysisService = new MatchAnalysisService(allCards);
	electronInjector.register(MatchAnalysisService, matchAnalysisService);

	const compsDetector = new CompositionDetectorService(allCards);
	electronInjector.register(CompositionDetectorService, compsDetector);

	const replayMetadataBuilder = new ReplayMetadataBuilderService(
		allCards,
		matchAnalysisService,
		patchesConfig,
		compsDetector,
		ads,
	);
	electronInjector.register(ReplayMetadataBuilderService, replayMetadataBuilder);

	const replayUploadService = new ReplayUploadService(
		preferences,
		userService,
		replayMetadataBuilder,
		powerLogBuffer,
	);
	electronInjector.register(ReplayUploadService, replayUploadService);

	const gameParserService = new GameParserService(allCards);
	electronInjector.register(GameParserService, gameParserService);

	const events = new Events();
	electronInjector.register(Events, events);

	const mercenariesReferenceDataService = new MercenariesReferenceDataService(windowManager);
	electronInjector.register(MercenariesReferenceDataService, mercenariesReferenceDataService);

	const endGameUploader = new EndGameUploaderService(
		replayUploadService,
		gameParserService,
		allCards,
		preferences,
		events,
		mercenariesReferenceDataService,
		gameStateFacade,
		bgsMetaCompositionStrategies,
		userService,
	);
	electronInjector.register(EndGameUploaderService, endGameUploader);

	const mercsMemoryCache = new MercenariesMemoryCacheService(windowManager);
	electronInjector.register(MercenariesMemoryCacheService, mercsMemoryCache);

	const mercenariesBattleStateService = new MercenariesBattleStateService(
		gameEventsEmitter,
		allCards,
		mercsMemoryCache,
		mercenariesReferenceDataService,
		preferences,
	);
	electronInjector.register(MercenariesBattleStateService, mercenariesBattleStateService);

	const mercenariesBattleStateFacadeService = new MercenariesBattleStateFacadeService(windowManager);
	electronInjector.register(MercenariesBattleStateFacadeService, mercenariesBattleStateFacadeService);

	const mercenariesOutOfCombatService = new MercenariesOutOfCombatService(memoryUpdates, scene, preferences);
	electronInjector.register(MercenariesOutOfCombatService, mercenariesOutOfCombatService);

	const mercenariesOutOfCombatFacadeService = new MercenariesOutOfCombatFacadeService(windowManager);
	electronInjector.register(MercenariesOutOfCombatFacadeService, mercenariesOutOfCombatFacadeService);

	const rewards = new RewardMonitorService(gameEventsEmitter, gameStatus, memoryUpdates);
	electronInjector.register(RewardMonitorService, rewards);

	const lotteryWidgetController = new LotteryWidgetControllerService(windowManager);
	electronInjector.register(LotteryWidgetControllerService, lotteryWidgetController);

	const lotteryService = new LotteryService(
		localStorage,
		gameEventsEmitter,
		api as any as ApiRunner,
		allCards,
		lotteryWidgetController,
	);
	electronInjector.register(LotteryService, lotteryService);

	const lottery = new LotteryFacadeService(windowManager);
	electronInjector.register(LotteryFacadeService, lottery);

	const gameModeData = new GameModeDataService(gameEventsEmitter, memoryInspection, deckParser);
	electronInjector.register(GameModeDataService, gameModeData);

	const arenaInfo = new ArenaInfoService(memoryInspection, scene, gameStateFacade, gameModeData, gameEventsEmitter);
	electronInjector.register(ArenaInfoService, arenaInfo);

	const inGameReplayService = new InGameReplayService(windowManager);
	electronInjector.register(InGameReplayService, inGameReplayService);

	const endGameListener = new EndGameListenerService(
		gameEventsEmitter,
		memoryUpdates,
		endGameUploader,
		mercsMemoryCache,
		memoryInspection,
		rewards,
		reviewId,
		lottery,
		allCards,
		gameStatus,
		arenaInfo,
		gameStateFacade,
		gameId,
		inGameReplayService,
		appVersion,
	);
	electronInjector.register(EndGameListenerService, endGameListener);

	const customAppearance = new CustomAppearanceService(windowManager);
	electronInjector.register(CustomAppearanceService, customAppearance);

	const settingsController = new SettingsControllerService(windowManager);
	electronInjector.register(SettingsControllerService, settingsController);

	const windowHandlerFacade = new WindowHandlerFacadeService(windowManager);
	electronInjector.register(WindowHandlerFacadeService, windowHandlerFacade);

	const bgsSceneService = new BgsSceneService(windowManager);
	electronInjector.register(BgsSceneService, bgsSceneService);

	const bgsInGameTimewarpedService = new BgsInGameTimewarpedService(windowManager);
	electronInjector.register(BgsInGameTimewarpedService, bgsInGameTimewarpedService);

	const bgsInGameTimewarpedGuardianService = new BgsInGameTimewarpedGuardianService(windowManager);
	electronInjector.register(BgsInGameTimewarpedGuardianService, bgsInGameTimewarpedGuardianService);

	const bgsPlayerHeroStats = new BgsPlayerHeroStatsService(windowManager);
	electronInjector.register(BgsPlayerHeroStatsService, bgsPlayerHeroStats);

	const bgsMetaHeroStats = new BgsMetaHeroStatsService(windowManager);
	electronInjector.register(BgsMetaHeroStatsService, bgsMetaHeroStats);

	const bgsMetaHeroStatsDuo = new BgsMetaHeroStatsDuoService(windowManager);
	electronInjector.register(BgsMetaHeroStatsDuoService, bgsMetaHeroStatsDuo);

	const bgsMetaHeroStatsAccess = new BgsMetaHeroStatsAccessService(api);
	electronInjector.register(BgsMetaHeroStatsAccessService, bgsMetaHeroStatsAccess);

	const bgsCards = new BattlegroundsCardsService(windowManager);
	electronInjector.register(BattlegroundsCardsService, bgsCards);

	const achievementsRawAchievementsLoader = new RawAchievementsLoaderService(api, preferences);
	electronInjector.register(RawAchievementsLoaderService, achievementsRawAchievementsLoader);

	const achievementsFirestoneRemoteAchievementsLoader = new FirestoneRemoteAchievementsLoaderService(
		api,
		userService,
		reviewId,
		diskCache,
	);
	electronInjector.register(FirestoneRemoteAchievementsLoaderService, achievementsFirestoneRemoteAchievementsLoader);

	const achievementsStorage = new AchievementsStorageService(localStorage);
	electronInjector.register(AchievementsStorageService, achievementsStorage);

	const achievementsMemoryMonitor = new AchievementsMemoryMonitor(
		events,
		memoryUpdates,
		gameEventsEmitter,
		memoryInspection,
		achievementsStorage,
	);
	electronInjector.register(AchievementsMemoryMonitor, achievementsMemoryMonitor);

	const achievementsHistoryStorage = new AchievementHistoryStorageService(achievementsStorage);
	electronInjector.register(AchievementHistoryStorageService, achievementsHistoryStorage);

	const achievementsHistoryService = new AchievementHistoryService(windowManager);
	electronInjector.register(AchievementHistoryService, achievementsHistoryService);

	const achievementsNotificationService = new AchievementsNotificationService(notifications, preferences, events);
	electronInjector.register(AchievementsNotificationService, achievementsNotificationService);

	const achievementsStateManager = new AchievementsStateManagerService(windowManager);
	electronInjector.register(AchievementsStateManagerService, achievementsStateManager);

	const gameStatsProviderService = new GameStatsProviderService(windowManager);
	electronInjector.register(GameStatsProviderService, gameStatsProviderService);
	electronInjector.register(GAME_STATS_PROVIDER_SERVICE_TOKEN, gameStatsProviderService);

	const globalStatsService = new GlobalStatsService(windowManager);
	electronInjector.register(GlobalStatsService, globalStatsService);

	const expertContributors = new ExpertContributorsService(windowManager);
	electronInjector.register(ExpertContributorsService, expertContributors);

	const bgsIntermediateResultsSimGuardianService = new BgsIntermediateResultsSimGuardianService(windowManager);
	electronInjector.register(BgsIntermediateResultsSimGuardianService, bgsIntermediateResultsSimGuardianService);

	const bgsMetaHeroStrategiesService = new BgsMetaHeroStrategiesService(windowManager);
	electronInjector.register(BgsMetaHeroStrategiesService, bgsMetaHeroStrategiesService);

	const mainWindowNavigationService = new MainWindowNavigationService(windowManager);
	electronInjector.register(MainWindowNavigationService, mainWindowNavigationService);

	// MainWindowStoreService dependencies
	const setsService = new SetsService(allCards);
	electronInjector.register(SetsService, setsService);

	const storeBootstrapService = new StoreBootstrapService(i18n);
	electronInjector.register(StoreBootstrapService, storeBootstrapService);

	const mainWindowStateService = new MainWindowStateFacadeService(windowManager);
	electronInjector.register(MainWindowStateFacadeService, mainWindowStateService);

	const bgsRunStatsEventHandlerService = new BgsRunStatsEventHandlerService(mainWindowStateService);
	electronInjector.register(BgsRunStatsEventHandlerService, bgsRunStatsEventHandlerService);
	electronInjector.register(BGS_RUN_STATS_EVENT_HANDLER, bgsRunStatsEventHandlerService);
	const bgsRunStatsService = new BgsRunStatsService(
		api as any as ApiRunner,
		events,
		userService,
		gameStatsProviderService,
		allCards,
		bgsRunStatsEventHandlerService,
	);
	electronInjector.register(BgsRunStatsService, bgsRunStatsService);

	const bgsInGameWindowNavigationService = new BgsInGameWindowNavigationService(windowManager);
	electronInjector.register(BgsInGameWindowNavigationService, bgsInGameWindowNavigationService);

	const packStatsService = new PackStatsService(
		events,
		setsService,
		userService,
		api as any as ApiRunner,
		diskCache,
		sqliteDb as any,
	);
	electronInjector.register(PackStatsService, packStatsService);

	const collectionManager = new CollectionManager(windowManager);
	electronInjector.register(CollectionManager, collectionManager);

	const setsManagerService = new SetsManagerService(windowManager);
	electronInjector.register(SetsManagerService, setsManagerService);

	const collectionBootstrapService = new CollectionBootstrapService(windowManager);
	electronInjector.register(CollectionBootstrapService, collectionBootstrapService);

	const achievementsRefLoaderService = new AchievementsRefLoaderService(api);
	electronInjector.register(AchievementsRefLoaderService, achievementsRefLoaderService);

	const bgsPerfectGamesService = new BgsPerfectGamesService(windowManager);
	electronInjector.register(BgsPerfectGamesService, bgsPerfectGamesService);

	const constructedPersonalDecksService = new ConstructedPersonalDecksService(windowManager);
	electronInjector.register(ConstructedPersonalDecksService, constructedPersonalDecksService);

	const collectionNavigationService = new CollectionNavigationService(windowManager);
	electronInjector.register(CollectionNavigationService, collectionNavigationService);

	const arenaNavigationService = new ArenaNavigationService(windowManager);
	electronInjector.register(ArenaNavigationService, arenaNavigationService);

	const battlegroundsNavigationService = new BattlegroundsNavigationService(windowManager);
	electronInjector.register(BattlegroundsNavigationService, battlegroundsNavigationService);

	const achievementsNavigationService = new AchievementsNavigationService(windowManager);
	electronInjector.register(AchievementsNavigationService, achievementsNavigationService);

	const bgsSimulatorControllerService = new BgsSimulatorControllerService(windowManager);
	electronInjector.register(BgsSimulatorControllerService, bgsSimulatorControllerService);

	const appNavigationService = new AppNavigationService(windowManager);
	electronInjector.register(AppNavigationService, appNavigationService);

	const decksProviderService = new DecksProviderService(windowManager);
	electronInjector.register(DecksProviderService, decksProviderService);

	const ngZone = null;
	electronInjector.register(NgZone, ngZone);

	const stateManagerService = new StateManagerService(allCards);
	electronInjector.register(StateManagerService, stateManagerService);

	const modsManager = new ModsManagerService(windowManager);
	electronInjector.register(ModsManagerService, modsManager);

	const achievementHistoryService = new AchievementHistoryService(windowManager);
	electronInjector.register(AchievementHistoryService, achievementHistoryService);

	const firestoneRemoteAchievementsLoaderService = new FirestoneRemoteAchievementsLoaderService(
		api,
		userService,
		reviewId,
		diskCache,
	);
	electronInjector.register(FirestoneRemoteAchievementsLoaderService, firestoneRemoteAchievementsLoaderService);

	const gameStatsLoaderService = new GameStatsLoaderService(windowManager);
	electronInjector.register(GameStatsLoaderService, gameStatsLoaderService);

	const achievementsManager = new AchievementsMemoryMonitor(
		events,
		memoryUpdates,
		gameEventsEmitter,
		memoryInspection,
		achievementsStorage,
	);
	electronInjector.register(AchievementsMemoryMonitor, achievementsManager);

	const gameStatsService = new GameStatsLoaderService(windowManager);
	electronInjector.register(GameStatsLoaderService, gameStatsService);

	const constructedNavigationService = new ConstructedNavigationService(windowManager);
	electronInjector.register(ConstructedNavigationService, constructedNavigationService);

	const mainWindowStoreService = new MainWindowStoreService(
		allCards,
		setsService,
		collectionManager,
		achievementHistoryService,
		firestoneRemoteAchievementsLoaderService,
		gameStatsLoaderService,
		events,
		storeBootstrapService,
		preferences,
		decksProviderService,
		bgsRunStatsService,
		i18n,
		packStatsService,
		setsManagerService,
		collectionBootstrapService,
		achievementsManager,
		achievementsStateManager,
		achievementsRefLoaderService,
		gameStatsService,
		bgsPerfectGamesService,
		constructedPersonalDecksService,
		constructedNavigationService,
		collectionNavigationService,
		arenaNavigationService,
		battlegroundsNavigationService,
		mainWindowNavigationService,
		achievementsNavigationService,
		bgsSimulatorControllerService,
		appNavigationService,
		ngZone,
		electronWindowHandler,
	);
	electronInjector.register(MainWindowStoreService, mainWindowStoreService);
	electronInjector.register(MAIN_WINDOW_STORE_SERVICE_TOKEN, mainWindowStoreService);

	const collectionStorageService = new CollectionStorageService(localStorage, diskCache);
	electronInjector.register(CollectionStorageService, collectionStorageService);

	const hotkeyFacadeService = new HotkeyFacadeService(windowManager);
	electronInjector.register(HotkeyFacadeService, hotkeyFacadeService);

	const arenaMetaHeroStrategiesService = new ArenaMetaHeroStrategiesService(windowManager);
	electronInjector.register(ArenaMetaHeroStrategiesService, arenaMetaHeroStrategiesService);

	const constructedConfig = new ConstructedConfigService(windowManager);
	electronInjector.register(ConstructedConfigService, constructedConfig);

	const battlegroundsCompsService = new BattlegroundsCompsService(windowManager);
	electronInjector.register(BattlegroundsCompsService, battlegroundsCompsService);

	const arenaRewardsService = new ArenaRewardsService(windowManager);
	electronInjector.register(ArenaRewardsService, arenaRewardsService);

	const arenaRunsService = new ArenaRunsService(windowManager);
	electronInjector.register(ArenaRunsService, arenaRunsService);

	const arenDeckDetailsService = new ArenDeckDetailsService(windowManager);
	electronInjector.register(ArenDeckDetailsService, arenDeckDetailsService);

	const renaHighWinsRunsService = new ArenaHighWinsRunsService(windowManager);
	electronInjector.register(ArenaHighWinsRunsService, renaHighWinsRunsService);

	const tavernBrawlService = new TavernBrawlService(windowManager);
	electronInjector.register(TavernBrawlService, tavernBrawlService);

	const profileServiceFacade = new ProfileServiceFacade(windowManager);
	electronInjector.register(ProfileServiceFacade, profileServiceFacade);

	const internalProfileCollectionService = new InternalProfileCollectionService(
		scene,
		ads,
		setsManagerService,
		collectionManager,
	);
	electronInjector.register(InternalProfileCollectionService, internalProfileCollectionService);

	const internalProfileAchievementsService = new InternalProfileAchievementsService(
		achievementsMemoryMonitor,
		scene,
		ads,
	);
	electronInjector.register(InternalProfileAchievementsService, internalProfileAchievementsService);

	const internalProfileBattlegroundsService = new InternalProfileBattlegroundsService(
		achievementsMemoryMonitor,
		achievementsRefLoaderService,
		allCards,
		localStorage,
		scene,
	);
	electronInjector.register(InternalProfileBattlegroundsService, internalProfileBattlegroundsService);

	const internalProfileInfoService = new InternalProfileInfoService(
		gameEventsEmitter,
		memoryInspection,
		allCards,
		localStorage,
	);
	electronInjector.register(InternalProfileInfoService, internalProfileInfoService);

	const profileUploaderService = new ProfileUploaderService(
		internalProfileCollectionService,
		internalProfileAchievementsService,
		internalProfileBattlegroundsService,
		internalProfileInfoService,
		api,
		gameStatus,
		diskCache,
		ads,
	);
	electronInjector.register(ProfileUploaderService, profileUploaderService);

	const liveStreamsService = new LiveStreamsService(windowManager);
	electronInjector.register(LiveStreamsService, liveStreamsService);

	const achievementsLiveProgressTrackingService = new AchievementsLiveProgressTrackingService(
		gameEventsEmitter,
		achievementsRefLoaderService,
		achievementsMemoryMonitor,
		achievementsStateManager,
		memoryInspection,
		gameStatus,
		preferences,
	);
	electronInjector.register(AchievementsLiveProgressTrackingService, achievementsLiveProgressTrackingService);

	const achievementsLiveTrackingFacadeService = new AchievementsLiveTrackingFacadeService(windowManager);
	electronInjector.register(AchievementsLiveTrackingFacadeService, achievementsLiveTrackingFacadeService);

	electronInjector.ready = true;
	return electronInjector;
};
