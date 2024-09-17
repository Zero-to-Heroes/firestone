import { sleep, sortByProperties } from '@firestone/shared/framework/common';
import { BehaviorSubject, distinctUntilChanged, map, Observable } from 'rxjs';
import { DropdownOption, SettingContext, SettingNode } from '../../settings.types';

const isRefreshingGames$$ = new BehaviorSubject<boolean>(false);
const isClearingGames$$ = new BehaviorSubject<boolean>(false);

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
								}
							},
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
		],
	};
};

const refreshGamesButtonText$ = (context: SettingContext): Observable<string> => {
	return isRefreshingGames$$.pipe(
		map((isRefreshing) =>
			isRefreshing
				? context.i18n.translateString('settings.general.data.refresh-progress-button-label')
				: context.i18n.translateString('settings.general.data.refresh-button-label'),
		),
	);
};

const clearGamesButtonText$ = (context: SettingContext): Observable<string> => {
	return isClearingGames$$.pipe(
		map((isClearing) =>
			isClearing
				? context.i18n.translateString('settings.general.data.refresh-progress-button-label')
				: context.i18n.translateString('settings.general.data.clear-button-label'),
		),
	);
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
