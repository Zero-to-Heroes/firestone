import {
	APP_VERSION_SERVICE_TOKEN,
	EndGameListenerService,
	EndGameUploaderService,
	GameParserService,
	ReplayUploadService,
	RewardMonitorService,
} from '@firestone/app/common';
import { GameNativeStateStoreService, LocalizationLoaderWithCache, QuestsService } from '@firestone/app/common';
import {
	ArenaCardStatsService,
	ArenaClassStatsService,
	ArenaDeckStatsService,
	ArenaDraftManagerService,
	ArenaInfoService,
	ArenaMulliganGuideService,
} from '@firestone/arena/common';
import { BgsBattleSimulationService, CompositionDetectorService } from '@firestone/battlegrounds/core';
import {
	BattlegroundsQuestsService,
	BattlegroundsTrinketsService,
	BgsBoardHighlighterService,
	BgsInGameHeroSelectionGuardianService,
	BgsInGameQuestsGuardianService,
	BgsInGameQuestsService,
	BgsInGameTrinketsGuardianService,
	BgsInGameTrinketsService,
	BgsMetaCompositionStrategiesService,
} from '@firestone/battlegrounds/services';
import {
	ConstructedMetaDecksStateService,
	ConstructedMulliganGuideGuardianService,
	ConstructedMulliganGuideService,
	ConstructedNavigationService,
} from '@firestone/constructed/common';
import { ElectronApiRunner, ElectronStorageService, StandaloneUserService } from '@firestone/electron/common';
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
	GameStateFacadeService,
	GameStateMetaInfoService,
	GameStateParsersService,
	GameStateService,
	GameUniqueIdService,
	OverlayDisplayService,
	RealTimeStatsParsersService,
	RealTimeStatsService,
	ReviewIdService,
	SecretConfigService,
	SecretsParserService,
} from '@firestone/game-state';
import {
	CardChoicesService,
	CardMousedOverService,
	MemoryInspectionService,
	MemoryUpdatesService,
	MindVisionFacadeService,
	MindVisionStateMachineService,
	SceneService,
} from '@firestone/memory';
import { BgsBattleSimulationWorkerService } from './bgs-battle-simulation-worker.service';
// import { CustomAppearanceService } from '@firestone/settings';
import { LotteryFacadeService, LotteryService, LotteryWidgetControllerService } from '@firestone/lottery/common';
import { MercenariesMemoryCacheService, MercenariesReferenceDataService } from '@firestone/mercenaries/common';
import { AccountService } from '@firestone/profile/common';
import {
	DiskCacheService,
	Events,
	GameStatusService,
	LOG_FILE_BACKEND,
	LogListenerService,
	LogUtilsService,
	NotificationsService,
	PatchesConfigService,
	PreferencesService,
	PreferencesStorageService,
	StandaloneAdService,
} from '@firestone/shared/common/service';
import {
	ADS_SERVICE_TOKEN,
	ApiRunner,
	CardRulesService,
	CardsFacadeService,
	CardsFacadeStandaloneService,
	DATABASE_SERVICE_TOKEN,
	IAdsService,
	IDatabaseService,
	ILocalizationService,
	LocalizationStandaloneService,
	LocalStorageService,
	OwUtilsService,
	USER_SERVICE_TOKEN,
	UserService,
	WindowManagerService,
	WINDOW_HANDLER_SERVICE_TOKEN,
} from '@firestone/shared/framework/core';
import { GameStatsLoaderService } from '@firestone/stats/data-access';
import { MatchAnalysisService, ReplayMetadataBuilderService } from '@firestone/stats/services';
import {
	FakeMissingTranslationHandler,
	TranslateDefaultParser,
	TranslateFakeCompiler,
	TranslateService,
	TranslateStore,
} from '@ngx-translate/core';
import { ElectronAngularInjector } from './electron-angular-injector';
import { ElectronAppVersionService } from './electron-app-version.service';
import { ElectronDiskCacheService } from './electron-disk-cache.service';
import { ElectronLogFileBackendService } from './electron-log-file-backend.service';
import { ElectronWindowHandlerService } from './electron-window-handler.service';
import { GameEventsElectronService } from './game-events-electron.service';
import { LowLevelUtilsElectronService } from './low-level-utils-electron.service';
import { MindVisionElectronService } from './mind-vision-electron.service';
import { SqliteDatabaseService } from './sqlite-database.service';

export const buildAppInjector = () => {
	const electronInjector = new ElectronAngularInjector();

	// Create and register services with the injector
	// FIXME: this instantiate everything, while we might want to have lazy loading
	const allCardsRaw = new CardsFacadeStandaloneService();
	const allCards: CardsFacadeService = allCardsRaw as any as CardsFacadeService;
	electronInjector.register(CardsFacadeStandaloneService, allCardsRaw);
	electronInjector.register(CardsFacadeService, allCards);

	const windowManager = new WindowManagerService(null);
	electronInjector.register(WindowManagerService, windowManager);

	const electronWindowHandler = new ElectronWindowHandlerService();
	electronInjector.register(WINDOW_HANDLER_SERVICE_TOKEN, electronWindowHandler);
	electronInjector.register(ElectronWindowHandlerService, electronWindowHandler);

	const gameStatus = new GameStatusService(windowManager);
	electronInjector.register(GameStatusService, gameStatus);

	const preferences = new PreferencesService(windowManager);
	electronInjector.register(PreferencesService, preferences);

	const logFileBackend = new ElectronLogFileBackendService();
	electronInjector.register(LOG_FILE_BACKEND, logFileBackend);

	const logUtils = new LogUtilsService(logFileBackend, preferences, gameStatus);
	electronInjector.register(LogUtilsService, logUtils);

	const logListener = new LogListenerService(logFileBackend, gameStatus, preferences, logUtils);
	electronInjector.register(LogListenerService, logListener);

	const localStorage = new ElectronStorageService();
	electronInjector.register(LocalStorageService, localStorage);

	const sqliteDb = new SqliteDatabaseService();
	electronInjector.register(DATABASE_SERVICE_TOKEN, sqliteDb as IDatabaseService);

	const diskCache = new ElectronDiskCacheService(preferences);
	electronInjector.register(DiskCacheService, diskCache as any as DiskCacheService);
	electronInjector.register(ElectronDiskCacheService, diskCache);

	const api = new ElectronApiRunner();
	electronInjector.register(ApiRunner, api as any as ApiRunner);

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

	const gameEventsElectron = new GameEventsElectronService();
	electronInjector.register(GameEventsElectronService, gameEventsElectron);

	const gameStateFacade = new GameStateFacadeService(windowManager);
	electronInjector.register(GameStateFacadeService, gameStateFacade);

	const gameId = new GameUniqueIdService(memoryInspection);
	electronInjector.register(GameUniqueIdService, gameId);

	const reviewId = new ReviewIdService(gameEventsEmitter);
	electronInjector.register(ReviewIdService, reviewId);

	const gameEventsFacade = new GameEventsFacadeService();
	electronInjector.register(GameEventsFacadeService, gameEventsFacade);

	const zone = null;

	const gameEvents = new GameEvents(
		gameEventsElectron,
		gameEventsEmitter,
		scene,
		gameStatus,
		allCards,
		gameStateFacade,
		gameId,
		gameEventsFacade,
		null,
		zone,
	);
	electronInjector.register(GameEvents, gameEvents);

	const gameStateMetaInfos = new GameStateMetaInfoService();
	electronInjector.register(GameStateMetaInfoService, gameStateMetaInfos);

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

	const i18n = new LocalizationStandaloneService(allCardsRaw, translate);
	electronInjector.register(LocalizationStandaloneService, i18n);
	electronInjector.register(ILocalizationService, i18n);

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

	// const customAppearance = new CustomAppearanceService(windowManager);
	// electronInjector.register(CustomAppearanceService, customAppearance);

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

	const bgsOfficialLeaderboard = new BattlegroundsOfficialLeaderboardService(windowManager);
	electronInjector.register(BattlegroundsOfficialLeaderboardService, bgsOfficialLeaderboard);

	const battleExecutor = new BgsBattleSimulationWorkerService(allCards);
	const simulation = new BgsBattleSimulationService(
		api as any as ApiRunner,
		allCards,
		battleExecutor,
		ads,
		null, // BugReportService
		preferences,
		null, // BgsIntermediateResultsSimGuardianService
	);
	electronInjector.register(BgsBattleSimulationService, simulation);

	const owUtils = new LowLevelUtilsElectronService();
	electronInjector.register(OwUtilsService, owUtils as any as OwUtilsService);

	const gameEventsParser = new GameStateParsersService(
		helper,
		allCards,
		i18n,
		aiDecks,
		deckHandler,
		memoryInspection,
		owUtils as any as OwUtilsService,
		preferences,
		deckParser,
		secretsConfig,
		constructedArchetypesOthestrator,
		gameEventsEmitter,
		null, // BugReportService
		null, // LogUploader
		simulation,
		ads,
		gameId,
		null, // BgsIntermediateResultsSimGuardianService
		reviewId,
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

	const realTimeStats = new RealTimeStatsService(gameEventsEmitter, scene, realTimeParsers,
		zone,);
	electronInjector.register(RealTimeStatsService, realTimeStats);

	const gameState = new GameStateService(
		gameEventsEmitter,
		gameStateMetaInfos,
		preferences,
		null, // OverwolfService
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

	const userService = new StandaloneUserService(windowManager) as any as UserService;
	electronInjector.register(StandaloneUserService, userService as any as StandaloneUserService);
	electronInjector.register(UserService, userService);
	electronInjector.register(USER_SERVICE_TOKEN, userService);

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

	const questService = new QuestsService(windowManager);
	electronInjector.register(QuestsService, questService);

	const cardRules = new CardRulesService(windowManager);
	electronInjector.register(CardRulesService, cardRules);

	const bgsMetaCompositionStrategies = new BgsMetaCompositionStrategiesService(windowManager);
	electronInjector.register(BgsMetaCompositionStrategiesService, bgsMetaCompositionStrategies);

	// Need to clean up the settings module first (split components / services)
	// const customAppearance = new CustomAppearanceService(windowManager);
	// electronInjector.register(CustomAppearanceService, customAppearance);

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

	const replayUploadService = new ReplayUploadService(preferences, userService, replayMetadataBuilder);
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

	const arenaInfo = new ArenaInfoService(memoryInspection, scene, gameStateFacade);
	electronInjector.register(ArenaInfoService, arenaInfo);

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
		appVersion,
	);
	electronInjector.register(EndGameListenerService, endGameListener);

	const notifications = new NotificationsService(windowManager);
	electronInjector.register(NotificationsService, notifications);

	return electronInjector;
};
