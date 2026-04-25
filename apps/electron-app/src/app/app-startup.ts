import { MainWindowStoreService } from '@firestone/mainwindow/common';
import { AppInjector } from '@firestone/shared/framework/core';

export const appStartup = async () => {
	console.log('appStartup');
	const mainWindowStore = AppInjector.get(MainWindowStoreService);
	await mainWindowStore.init();
};
