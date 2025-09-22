import { ElectronApiRunner, ElectronStorageService } from '@firestone/electron/common';
import { DeckHandlerService } from '@firestone/game-state';
import {
	MemoryInspectionService,
	MemoryUpdatesService,
	MindVisionFacadeService,
	MindVisionStateMachineService,
	SceneService,
} from '@firestone/memory';
import {
	DeckParserFacadeService,
	DeckParserService,
	GameEventsEmitterService,
	GameStatusService,
	PreferencesService,
	PreferencesStorageService,
} from '@firestone/shared/common/service';
import {
	ApiRunner,
	CardsFacadeService,
	CardsFacadeStandaloneService,
	LocalStorageService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { ElectronAngularInjector } from './electron-angular-injector';
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

	const mindVisionInspection = new MemoryInspectionService(
		gameStatus,
		mindVisionFacade as any as MindVisionFacadeService,
		mindVisionStateMachine,
	);
	electronInjector.register(MemoryInspectionService, mindVisionInspection);

	const scene = new SceneService(windowManager);
	electronInjector.register(SceneService, scene);

	const gameEventsEmitter = new GameEventsEmitterService();
	electronInjector.register(GameEventsEmitterService, gameEventsEmitter);

	const deckHandler = new DeckHandlerService(allCards as any as CardsFacadeService);
	electronInjector.register(DeckHandlerService, deckHandler);

	const deckParser = new DeckParserService(
		gameEventsEmitter,
		memoryUpdates,
		mindVisionInspection,
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

	return electronInjector;
};
