import { ElectronApiRunner, ElectronStorageService } from '@firestone/electron/common';
import { DeckHandlerService } from '@firestone/game-state';
// import { DeckParserFacadeService, DeckParserService } from '@firestone/legacy/feature-shell';
import {
	MemoryInspectionService,
	MemoryUpdatesService,
	MindVisionFacadeService,
	MindVisionStateMachineService,
	SceneService,
} from '@firestone/memory';
import { GameStatusService, PreferencesService, PreferencesStorageService } from '@firestone/shared/common/service';
import {
	ApiRunner,
	CardsFacadeService,
	CardsFacadeStandaloneService,
	LocalStorageService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
// import { GameEventsEmitterService } from '@legacy-import/src/lib/js/services/game-events-emitter.service';
import { ElectronAngularInjector } from './electron-angular-injector';
import { MindVisionElectronService } from './mind-vision-electron.service';

export const buildAppInjector = () => {
	const electronInjector = new ElectronAngularInjector();

	// Create and register services with the injector
	// FIXME: this instantiate everything, while we might want to have lazy loading
	const allCards = new CardsFacadeStandaloneService();
	const windowManager = new WindowManagerService(null);
	const gameStatus = new GameStatusService(windowManager);
	const preferences = new PreferencesService(windowManager);
	const localStorage = new ElectronStorageService();
	const api = new ElectronApiRunner();
	const preferencesStorage = new PreferencesStorageService(localStorage);
	const memoryUpdates = new MemoryUpdatesService(windowManager);
	const mindVisionFacade = new MindVisionElectronService(memoryUpdates);
	const mindVisionStateMachine = new MindVisionStateMachineService(
		mindVisionFacade as any as MindVisionFacadeService,
		gameStatus,
		memoryUpdates,
		null,
	);
	const mindVisionInspection = new MemoryInspectionService(
		gameStatus,
		mindVisionFacade as any as MindVisionFacadeService,
		mindVisionStateMachine,
	);
	const scene = new SceneService(windowManager);
	// TODO: uncomment this, and split components vs server dependencies for electron
	// const deckParserFacade = new DeckParserFacadeService(windowManager);
	// const gameEventsEmitter = new GameEventsEmitterService();
	const deckHandler = new DeckHandlerService(allCards as any as CardsFacadeService);
	// const deckParser = new DeckParserService(
	// 	gameEventsEmitter,
	// 	memoryUpdates,
	// 	mindVisionInspection,
	// 	allCards as any as CardsFacadeService,
	// 	null, // FIXME: replace OW service with something else
	// 	deckHandler,
	// 	api as any as ApiRunner,
	// 	preferences,
	// 	gameStatus,
	// 	scene,
	// );

	// Register services in the injector
	electronInjector.register(WindowManagerService, windowManager);
	electronInjector.register(GameStatusService, gameStatus);
	electronInjector.register(PreferencesService, preferences);
	electronInjector.register(LocalStorageService, localStorage);
	electronInjector.register(PreferencesStorageService, preferencesStorage);
	electronInjector.register(MemoryUpdatesService, memoryUpdates);
	electronInjector.register(MindVisionElectronService, mindVisionFacade);
	electronInjector.register(MindVisionStateMachineService, mindVisionStateMachine);
	electronInjector.register(MemoryInspectionService, mindVisionInspection);
	electronInjector.register(SceneService, scene);
	// electronInjector.register(DeckParserFacadeService, deckParserFacade);
	// electronInjector.register(DeckParserService, deckParser);
	// electronInjector.register(GameEventsEmitterService, gameEventsEmitter);
	electronInjector.register(CardsFacadeStandaloneService, allCards);
	electronInjector.register(CardsFacadeService, allCards as any as CardsFacadeService);
	electronInjector.register(DeckHandlerService, deckHandler);
	electronInjector.register(ApiRunner, api as any as ApiRunner);

	return electronInjector;
};
