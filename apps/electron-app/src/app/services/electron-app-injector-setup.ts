import { ElectronStorageService } from '@firestone/electron/common';
import { MemoryInspectionService, MemoryUpdatesService, MindVisionStateMachineService } from '@firestone/memory';
import { GameStatusService, PreferencesService, PreferencesStorageService } from '@firestone/shared/common/service';
import { LocalStorageService, WindowManagerService } from '@firestone/shared/framework/core';
import { MindVisionFacadeService } from 'libs/memory/src/lib/services/mind-vision/mind-vision-facade.service';
import { ElectronAngularInjector } from './electron-angular-injector';
import { MindVisionElectronService } from './mind-vision-electron.service';

export const buildAppInjector = () => {
	const electronInjector = new ElectronAngularInjector();

	// Create and register services with the injector
	// FIXME: this instantiate everything, while we might want to have lazy loading
	const windowManager = new WindowManagerService(null);
	const gameStatusService = new GameStatusService(windowManager);
	const preferencesService = new PreferencesService(windowManager);
	const localStorageService = new ElectronStorageService();
	const preferencesStorageService = new PreferencesStorageService(localStorageService);
	const memoryUpdates = new MemoryUpdatesService();
	const mindVisionFacade = new MindVisionElectronService(memoryUpdates);
	const mindVisionStateMachine = new MindVisionStateMachineService(
		mindVisionFacade as any as MindVisionFacadeService,
		gameStatusService,
		memoryUpdates,
		null,
	);
	const mindVisionInspection = new MemoryInspectionService(
		gameStatusService,
		mindVisionFacade as any as MindVisionFacadeService,
		mindVisionStateMachine,
	);

	// Register services in the injector
	electronInjector.register(WindowManagerService, windowManager);
	electronInjector.register(GameStatusService, gameStatusService);
	electronInjector.register(PreferencesService, preferencesService);
	electronInjector.register(LocalStorageService, localStorageService);
	electronInjector.register(PreferencesStorageService, preferencesStorageService);
	electronInjector.register(MemoryUpdatesService, memoryUpdates);
	electronInjector.register(MindVisionElectronService, mindVisionFacade);
	electronInjector.register(MindVisionStateMachineService, mindVisionStateMachine);
	electronInjector.register(MemoryInspectionService, mindVisionInspection);

	return electronInjector;
};
