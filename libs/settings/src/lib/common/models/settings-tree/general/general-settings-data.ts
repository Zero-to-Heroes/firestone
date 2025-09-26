import { sleep, sortByProperties } from '@firestone/shared/framework/common';
import { BehaviorSubject, distinctUntilChanged, map, Observable } from 'rxjs';
import { DropdownOption, SettingContext, SettingNode } from '../../settings.types';

const isRefreshingGames$$ = new BehaviorSubject<boolean>(false);
const settingImportStatus$$ = new BehaviorSubject<'done' | 'working' | 'showing-confirmation'>('done');
// const isRefreshingPacks$$ = new BehaviorSubject<boolean>(false);
// const isRefreshingAchievements$$ = new BehaviorSubject<boolean>(false);
// const isRefreshingArenaRewards$$ = new BehaviorSubject<boolean>(false);
const isClearingGames$$ = new BehaviorSubject<boolean>(false);
const isClearingLocalCache$$ = new BehaviorSubject<boolean>(false);

export const generalDataSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'general-data',
		name: context.i18n.translateString('settings.general.menu.data'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'general-data',
				title: context.i18n.translateString('settings.general.menu.data'),
				settings: [
					{
						type: 'toggle',
						field: 'allowGamesShare',
						label: context.i18n.translateString('settings.general.launch.allow-games-share-label'),
						tooltip: context.i18n.translateString('settings.general.launch.allow-games-share-tooltip'),
					},
				],
			},
			{
				id: 'general-data-remote',
				title: context.i18n.translateString('settings.general.data.remote-title'),
				texts: [context.i18n.translateString('settings.general.data.remote-intro-text')],
				settings: [
					{
						type: 'toggle',
						field: 'disableLocalCache',
						label: context.i18n.translateString('settings.general.data.disable-local-cache'),
						tooltip: context.i18n.translateString('settings.general.data.disable-local-cache-tooltip'),
						toggleConfig: {
							toggleFunction: (disableCache: boolean) => {
								if (disableCache) {
									context.services.diskCache.clearCache();
									context.services.db.clearDb();
								}
							},
						},
					},
					{
						label: context.i18n.translateString('settings.general.data.open-local-cache-folder'),
						text: context.i18n.translateString('settings.general.data.open-local-cache-folder-button'),
						tooltip: null,
						action: async () => context.ow.openLocalCacheFolder(),
					},
					{
						label: context.i18n.translateString('settings.general.data.clear-local-cache'),
						text: clearCacheButtonText$(context),
						tooltip: context.i18n.translateString('settings.general.data.clear-local-cache-tooltip'),
						action: async () => {
							isClearingLocalCache$$.next(true);
							// Make sure we don't return too quickly, otherwise the user might think nothing happened
							await Promise.all([context.services.diskCache.clearCache(), context.services.db.clearDb(), sleep(1000)]);
							isClearingLocalCache$$.next(false);
						},
					},
				],
			},
			{
				id: 'general-data-games',
				title: context.i18n.translateString('settings.general.data.games-title'),
				texts: [gamesText$(context)],
				settings: [
					{
						type: 'dropdown',
						field: 'replaysLoadPeriod',
						label: context.i18n.translateString('settings.general.data.games-period'),
						tooltip: null,
						// advancedSetting: true,
						dropdownConfig: {
							options: gamesPeriodOptions(context),
						},
					},
					{
						label: context.i18n.translateString('settings.general.data.refresh-button-label'),
						text: refreshGamesButtonText$(context),
						tooltip: context.i18n.translateString('settings.general.data.games-tooltip'),
						action: async () => {
							isRefreshingGames$$.next(true);
							// Make sure we don't return too quickly, otherwise the user might think nothing happened
							await Promise.all([context.services.gamesLoader.fullRefresh(), sleep(1000)]);
							isRefreshingGames$$.next(false);
						},
					},
					{
						label: context.i18n.translateString('settings.general.data.clear-games-label'),
						text: clearGamesButtonText$(context),
						tooltip: context.i18n.translateString('settings.general.data.clear-games-tooltip'),
						action: async () => {
							isClearingGames$$.next(true);
							await Promise.all([await context.services.gamesLoader.clearGames(), sleep(1000)]);
							isClearingGames$$.next(false);
						},
					},
				],
			},
			{
				id: 'general-data-settings',
				title: context.i18n.translateString('settings.general.data.settings-title'),
				settings: [
					{
						label: context.i18n.translateString('settings.general.data.export-settings-button-label'),
						text: context.i18n.translateString('settings.general.data.export-settings-button-label'),
						tooltip: context.i18n.translateString('settings.general.data.export-settings-button-tooltip'),
						action: async () => {
							await context.services.settingsController.exportSettings();
							context.ow.openLocalCacheFolder();
						},
					},
					{
						label: context.i18n.translateString('settings.general.data.import-settings-button-label'),
						text: importingSettingsButtonText$(context),
						tooltip: context.i18n.translateString('settings.general.data.import-settings-button-tooltip'),
						action: async () => {
							const selectedFilePath = await context.ow.openAppFilePicker();
							if (selectedFilePath != null) {
								settingImportStatus$$.next('working');
								await context.services.settingsController.importSettings(selectedFilePath);
								await sleep(1000);
								settingImportStatus$$.next('showing-confirmation');
								await sleep(8000);
								settingImportStatus$$.next('done');
							}
						},
					},
				],
			},
			// {
			// 	id: 'general-data-other',
			// 	title: context.i18n.translateString('settings.general.data.other-title'),
			// 	settings: [
			// 		{
			// 			label: context.i18n.translateString('settings.general.data.packs'),
			// 			text: refreshPacksButtonText$(context),
			// 			tooltip: context.i18n.translateString('settings.general.data.packs-tooltip'),
			// 			action: async () => {
			// 				isRefreshingPacks$$.next(true);
			// 				// Make sure we don't return too quickly, otherwise the user might think nothing happened
			// 				await Promise.all([context.services.packService.refreshPackStats(), sleep(1000)]);
			// 				isRefreshingPacks$$.next(false);
			// 			},
			// 		},
			// 		{
			// 			label: context.i18n.translateString('settings.general.data.achievements'),
			// 			text: refreshAchievementsButtonText$(context),
			// 			tooltip: context.i18n.translateString('settings.general.data.achievements-tooltip'),
			// 			action: async () => {
			// 				isRefreshingAchievements$$.next(true);
			// 				await Promise.all([await context.services.remoteAchievements.loadAchievements(), sleep(1000)]);
			// 				isRefreshingAchievements$$.next(false);
			// 			},
			// 		},
			// 		{
			// 			label: context.i18n.translateString('settings.general.data.arena-rewards'),
			// 			text: refreshArenaRewardsButtonText$(context),
			// 			tooltip: context.i18n.translateString('settings.general.data.arena-rewards-tooltip'),
			// 			action: async () => {
			// 				isRefreshingArenaRewards$$.next(true);
			// 				await Promise.all([await context.services.arenaRewards.refreshRewards(), sleep(1000)]);
			// 				isRefreshingArenaRewards$$.next(false);
			// 			},
			// 		},
			// 	],
			// },
		],
	};
};

const refreshGamesButtonText$ = (context: SettingContext): Observable<string> => {
	return isRefreshingGames$$.pipe(map((isRefreshing) => (isRefreshing ? context.i18n.translateString('settings.general.data.refresh-progress-button-label') : context.i18n.translateString('settings.general.data.refresh-button-label'))));
};

const clearCacheButtonText$ = (context: SettingContext): Observable<string> => {
	return isClearingLocalCache$$.pipe(map((isRefreshing) => (isRefreshing ? context.i18n.translateString('settings.general.data.refresh-progress-button-label') : context.i18n.translateString('settings.general.data.refresh-button-label'))));
};

const importingSettingsButtonText$ = (context: SettingContext): Observable<string> => {
	return settingImportStatus$$.pipe(
		map((status) =>
			status === 'done'
				? context.i18n.translateString('settings.general.data.import-settings-button-label')
				: status === 'working'
					? context.i18n.translateString('settings.general.data.refresh-progress-button-label')
					: context.i18n.translateString('settings.general.data.import-settings-button-confirmed-label'),
		),
	);
};

// const refreshPacksButtonText$ = (context: SettingContext): Observable<string> => {
// 	return isRefreshingPacks$$.pipe(map((isRefreshing) => (isRefreshing ? context.i18n.translateString('settings.general.data.refresh-progress-button-label') : context.i18n.translateString('settings.general.data.refresh-button-label'))));
// };

// const refreshAchievementsButtonText$ = (context: SettingContext): Observable<string> => {
// 	return isRefreshingAchievements$$.pipe(map((isRefreshing) => (isRefreshing ? context.i18n.translateString('settings.general.data.refresh-progress-button-label') : context.i18n.translateString('settings.general.data.refresh-button-label'))));
// };

// const refreshArenaRewardsButtonText$ = (context: SettingContext): Observable<string> => {
// 	return isRefreshingArenaRewards$$.pipe(map((isRefreshing) => (isRefreshing ? context.i18n.translateString('settings.general.data.refresh-progress-button-label') : context.i18n.translateString('settings.general.data.refresh-button-label'))));
// };

// const exportSettingsButtonText$ = (context: SettingContext): Observable<string> => {
// 	return of(context.i18n.translateString('export-settings-button-label'));
// };

const clearGamesButtonText$ = (context: SettingContext): Observable<string> => {
	return isClearingGames$$.pipe(map((isClearing) => (isClearing ? context.i18n.translateString('settings.general.data.refresh-progress-button-label') : context.i18n.translateString('settings.general.data.clear-button-label'))));
};

const gamesPeriodOptions = (context: SettingContext): readonly DropdownOption[] => {
	return ['all-time', 'past-100', 'last-patch', 'past-7', 'season-start']
		.map((value) => ({
			value: value,
			label: context.i18n.translateString(`settings.general.data.games-period-options.${value}`) ?? '',
		}))
		.sort(sortByProperties((o) => [o.label]));
};

const gamesText$ = (context: SettingContext): Observable<string> => {
	return context.services.gamesLoader.gameStats$$.pipe(
		map((stats) => stats?.stats?.length ?? 0),
		distinctUntilChanged(),
		map((totalGames) =>
			context.i18n.translateString('settings.general.data.total-games', {
				value: totalGames,
			}),
		),
	);
};
