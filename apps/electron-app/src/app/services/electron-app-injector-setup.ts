import { GameNativeStateStoreService } from '@firestone/app/common';
import { ArenaDraftManagerService, ArenaMulliganGuideService } from '@firestone/arena/common';
import {
	BattlegroundsQuestsService,
	BgsBoardHighlighterService,
	BgsInGameHeroSelectionGuardianService,
	BgsInGameQuestsGuardianService,
	BgsInGameQuestsService,
	BgsInGameTrinketsGuardianService,
	BgsInGameTrinketsService,
} from '@firestone/battlegrounds/common';
import { BgsBattleSimulationMockExecutorService, BgsBattleSimulationService } from '@firestone/battlegrounds/core';
import { ConstructedMulliganGuideService } from '@firestone/constructed/common';
import { ElectronApiRunner, ElectronStorageService } from '@firestone/electron/common';
import {
	AiDeckService,
	BattlegroundsOfficialLeaderboardService,
	BgsMatchMemoryInfoService,
	BgsMatchPlayersMmrService,
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
// import { CustomAppearanceService } from '@firestone/settings';
import {
	GameStatusService,
	LOG_FILE_BACKEND,
	LogUtilsService,
	PatchesConfigService,
	PreferencesService,
	PreferencesStorageService,
	StandaloneAdService,
} from '@firestone/shared/common/service';
import {
	ADS_SERVICE_TOKEN,
	ApiRunner,
	CardsFacadeService,
	CardsFacadeStandaloneService,
	IAdsService,
	LocalizationStandaloneService,
	LocalStorageService,
	OwUtilsService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { LogListenerService } from '@services/log-listener.service';
import { ElectronAngularInjector } from './electron-angular-injector';
import { ElectronLogFileBackendService } from './electron-log-file-backend.service';
import { GameEventsElectronService } from './game-events-electron.service';
import { LowLevelUtilsElectronService } from './low-level-utils-electron.service';
import { MindVisionElectronService } from './mind-vision-electron.service';

export const buildAppInjector = () => {
	const electronInjector = new ElectronAngularInjector();

	// Create and register services with the injector
	// FIXME: this instantiate everything, while we might want to have lazy loading
	const allCards = new CardsFacadeStandaloneService();
	electronInjector.register(CardsFacadeStandaloneService, allCards);
	electronInjector.register(CardsFacadeService, allCards as any as CardsFacadeService);

	const windowManager = new WindowManagerService(null);
	electronInjector.register(WindowManagerService, windowManager);

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

	const deckHandler = new DeckHandlerService(allCards as any as CardsFacadeService);
	electronInjector.register(DeckHandlerService, deckHandler);

	const deckParser = new DeckParserService(
		gameEventsEmitter,
		memoryUpdates,
		memoryInspection,
		allCards as any as CardsFacadeService,
		null, // FIXME: replace OW service with something else
		deckHandler,
		api as any as ApiRunner,
		preferences,
		gameStatus,
		scene,
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

	const gameEvents = new GameEvents(
		gameEventsElectron,
		gameEventsEmitter,
		scene,
		gameStatus,
		allCards as any as CardsFacadeService,
		gameStateFacade,
		gameId,
		gameEventsFacade,
		null,
	);
	electronInjector.register(GameEvents, gameEvents);

	const gameStateMetaInfos = new GameStateMetaInfoService();
	electronInjector.register(GameStateMetaInfoService, gameStateMetaInfos);

	// TODO: translation service
	const i18n = new LocalizationStandaloneService(allCards, null);
	electronInjector.register(LocalizationStandaloneService, i18n);

	const helper = new DeckManipulationHelper(allCards as any as CardsFacadeService, i18n);
	electronInjector.register(DeckManipulationHelper, helper);

	const secretsParser = new SecretsParserService(helper, allCards as any as CardsFacadeService);
	electronInjector.register(SecretsParserService, secretsParser);

	const aiDecks = new AiDeckService(api as any as ApiRunner);
	electronInjector.register(AiDeckService, aiDecks);

	const secretsConfig = new SecretConfigService(api as any as ApiRunner, allCards as any as CardsFacadeService);
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

	const constructedMulliganGuide = new ConstructedMulliganGuideService(windowManager);
	electronInjector.register(ConstructedMulliganGuideService, constructedMulliganGuide);

	const constructedArchetypes = new ConstructedArchetypeService(
		api as any as ApiRunner,
		allCards as any as CardsFacadeService,
	);
	electronInjector.register(ConstructedArchetypeService, constructedArchetypes);

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

	// TODO: use a real battle sim service
	const battleExecutor = new BgsBattleSimulationMockExecutorService();
	const simulation = new BgsBattleSimulationService(
		api as any as ApiRunner,
		allCards as any as CardsFacadeService,
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
		allCards as any as CardsFacadeService,
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

	const realTimeParsers = new RealTimeStatsParsersService(allCards as any as CardsFacadeService);
	electronInjector.register(RealTimeStatsParsersService, realTimeParsers);

	const realTimeStats = new RealTimeStatsService(gameEventsEmitter, scene, realTimeParsers);
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
	);
	electronInjector.register(GameStateService, gameState);

	return electronInjector;
};
