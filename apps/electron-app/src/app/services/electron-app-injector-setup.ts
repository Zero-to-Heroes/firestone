import { ElectronStorageService } from '@firestone/electron/common';
import { MemoryUpdatesService } from '@firestone/memory';
import { GameStatusService, PreferencesService, PreferencesStorageService } from '@firestone/shared/common/service';
import { LocalStorageService, WindowManagerService } from '@firestone/shared/framework/core';
import { ElectronAngularInjector } from './electron-angular-injector';

export const buildAppInjector = () => {
	const electronInjector = new ElectronAngularInjector();

	// Create and register services with the injector
	const windowManager = new WindowManagerService(null);
	const gameStatusService = new GameStatusService(windowManager);
	const preferencesService = new PreferencesService(windowManager);
	const localStorageService = new ElectronStorageService();
	const preferencesStorageService = new PreferencesStorageService(localStorageService);
	const memoryUpdates = new MemoryUpdatesService();

	// Register services in the injector
	electronInjector.register(WindowManagerService, windowManager);
	electronInjector.register(GameStatusService, gameStatusService);
	electronInjector.register(PreferencesService, preferencesService);
	electronInjector.register(PreferencesStorageService, preferencesStorageService);
	electronInjector.register(LocalStorageService, localStorageService);
	electronInjector.register(MemoryUpdatesService, memoryUpdates);

	return electronInjector;
};
