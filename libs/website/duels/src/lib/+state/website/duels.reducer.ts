import { LocalStorageService } from '@firestone/shared/framework/core';
import { WebsitePreferencesService } from '@firestone/website/core';
import { Action, createReducer, on } from '@ngrx/store';

import * as WebsiteDuelsActions from './duels.actions';
import { WebsiteDuelsState } from './duels.models';

export const WEBSITE_DUELS_FEATURE_KEY = 'websiteDuels';

export interface WebsiteDuelsPartialState {
	readonly [WEBSITE_DUELS_FEATURE_KEY]: WebsiteDuelsState;
}

const localPrefsService = new WebsitePreferencesService(new LocalStorageService());
const localPrefs = localPrefsService.getPreferences();
export const initialWebsiteDuelsState: WebsiteDuelsState = {
	loaded: false,
	currentPercentileSelection: localPrefs?.duelsActiveMmrFilter ?? 100,
	currentTimePeriodSelection: localPrefs?.duelsActiveTimeFilter ?? 'last-patch',
	// currentTribesSelection: localPrefs?.bgsActiveTribesFilter ?? [],
};

const reducer = createReducer(
	initialWebsiteDuelsState,
	on(WebsiteDuelsActions.initDuelsMetaHeroStats, (state) => ({ ...state, loaded: false, error: null })),
	on(WebsiteDuelsActions.loadDuelsMetaHeroStatsSuccess, (state, { stats, lastUpdateDate, mmrPercentiles }) => ({
		...state,
		heroStats: stats,
		lastUpdateDate: lastUpdateDate,
		mmrPercentiles: mmrPercentiles,
		loaded: true,
	})),
	on(WebsiteDuelsActions.loadDuelsMetaHeroStatsFailure, (state, { error }) => ({ ...state, error })),

	on(WebsiteDuelsActions.initDuelsMetaHeroPowerStats, (state) => ({ ...state, loaded: false, error: null })),
	on(WebsiteDuelsActions.loadDuelsMetaHeroPowerStatsSuccess, (state, { stats, lastUpdateDate, mmrPercentiles }) => ({
		...state,
		heroPowerStats: stats,
		lastUpdateDate: lastUpdateDate,
		mmrPercentiles: mmrPercentiles,
		loaded: true,
	})),
	on(WebsiteDuelsActions.loadDuelsMetaHeroPowerStatsFailure, (state, { error }) => ({ ...state, error })),

	on(WebsiteDuelsActions.initDuelsMetaSignatureTreasureStats, (state) => ({ ...state, loaded: false, error: null })),
	on(
		WebsiteDuelsActions.loadDuelsMetaSignatureTreasureStatsSuccess,
		(state, { stats, lastUpdateDate, mmrPercentiles }) => ({
			...state,
			signatureTreasureStats: stats,
			lastUpdateDate: lastUpdateDate,
			mmrPercentiles: mmrPercentiles,
			loaded: true,
		}),
	),
	on(WebsiteDuelsActions.loadDuelsMetaSignatureTreasureStatsFailure, (state, { error }) => ({ ...state, error })),

	on(WebsiteDuelsActions.changeMetaHeroStatsPercentileFilter, (state, { currentPercentileSelection }) => ({
		...state,
		currentPercentileSelection: currentPercentileSelection,
		loaded: false,
		error: null,
	})),
	on(WebsiteDuelsActions.changeMetaHeroStatsTimeFilter, (state, { currentTimePeriodSelection }) => ({
		...state,
		currentTimePeriodSelection: currentTimePeriodSelection,
		loaded: false,
		error: null,
	})),
);

export function websiteDuelsReducer(state: WebsiteDuelsState | undefined, action: Action) {
	return reducer(state, action);
}
