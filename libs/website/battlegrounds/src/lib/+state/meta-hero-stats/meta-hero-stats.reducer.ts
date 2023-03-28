import { LocalStorageService } from '@firestone/shared/framework/core';
import { Action, createReducer, on } from '@ngrx/store';
import { WebsitePreferencesService } from 'libs/website/core/src/lib/preferences/website-preferences.service';

import * as MetaHeroStatsStateActions from './meta-hero-stats.actions';
import { MetaHeroStatsState } from './meta-hero-stats.models';

export const WEBSITE_BGS_META_HERO_STATS_FEATURE_KEY = 'websiteBgsMetaHeroStats';

export interface MetaHeroStatsPartialState {
	readonly [WEBSITE_BGS_META_HERO_STATS_FEATURE_KEY]: MetaHeroStatsState;
}

const localPrefsService = new WebsitePreferencesService(new LocalStorageService());
const localPrefs = localPrefsService.getPreferences();

export const initialMetaHeroStatsState: MetaHeroStatsState = {
	loaded: false,
	currentPercentileSelection: localPrefs?.bgsActiveRankFilter ?? 100,
	currentTimePeriodSelection: localPrefs?.bgsActiveTimeFilter ?? 'last-patch',
	currentTribesSelection: localPrefs?.bgsActiveTribesFilter ?? [],
};

const reducer = createReducer(
	initialMetaHeroStatsState,
	on(MetaHeroStatsStateActions.initBgsMetaHeroStats, (state) => ({ ...state, loaded: false, error: null })),
	on(MetaHeroStatsStateActions.loadBgsMetaHeroStatsSuccess, (state, { stats, lastUpdateDate, mmrPercentiles }) => ({
		...state,
		stats: stats,
		lastUpdateDate: lastUpdateDate,
		mmrPercentiles: mmrPercentiles,
		loaded: true,
	})),
	on(MetaHeroStatsStateActions.loadBgsMetaHeroStatsFailure, (state, { error }) => ({ ...state, error })),
	on(MetaHeroStatsStateActions.changeMetaHeroStatsTimeFilter, (state, { currentTimePeriodSelection }) => ({
		...state,
		currentTimePeriodSelection: currentTimePeriodSelection,
		loaded: false,
		error: null,
	})),
	on(MetaHeroStatsStateActions.changeMetaHeroStatsPercentileFilter, (state, { currentPercentileSelection }) => ({
		...state,
		currentPercentileSelection: currentPercentileSelection,
		loaded: false,
		error: null,
	})),
	on(MetaHeroStatsStateActions.changeMetaHeroStatsTribesFilter, (state, { currentTribesSelection }) => ({
		...state,
		currentTribesSelection: currentTribesSelection,
		loaded: false,
		error: null,
	})),
);

export function metaHeroStatsStateReducer(state: MetaHeroStatsState | undefined, action: Action) {
	return reducer(state, action);
}
