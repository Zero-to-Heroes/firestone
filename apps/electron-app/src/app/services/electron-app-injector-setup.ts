import { GameStatusService, PreferencesService } from '@firestone/shared/common/service';
import { WindowManagerService } from '@firestone/shared/framework/core';
import { ElectronAngularInjector } from './electron-angular-injector';

export const buildAppInjector = () => {
	const electronInjector = new ElectronAngularInjector();

	// Create and register services with the injector
	const windowManager = new WindowManagerService(null);
	const gameStatusService = new GameStatusService(windowManager);
	const preferencesService = new PreferencesService(windowManager);

	// Register services in the injector
	electronInjector.register(WindowManagerService, windowManager);
	electronInjector.register(GameStatusService, gameStatusService);
	electronInjector.register(PreferencesService, preferencesService);

	return electronInjector;
};
