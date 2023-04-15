import { createFeatureSelector, createSelector } from '@ngrx/store';
import { MetaHeroStatsState } from './meta-hero-stats.models';
import { WEBSITE_BGS_META_HERO_STATS_FEATURE_KEY } from './meta-hero-stats.reducer';

// Lookup the feature state managed by NgRx
export const getMetaHeroStatsState = createFeatureSelector<MetaHeroStatsState>(WEBSITE_BGS_META_HERO_STATS_FEATURE_KEY);

export const getLoaded = createSelector(getMetaHeroStatsState, (state: MetaHeroStatsState) => state.loaded);

export const getMetaHeroStatsLoaded = createSelector(
	getMetaHeroStatsState,
	(state: MetaHeroStatsState) => state.loaded,
);

export const getMetaHeroStatsError = createSelector(getMetaHeroStatsState, (state: MetaHeroStatsState) => state.error);

export const getAllMetaHeroStats = createSelector(getMetaHeroStatsState, (state: MetaHeroStatsState) => state.stats);

export const getMmrPercentiles = createSelector(
	getMetaHeroStatsState,
	(state: MetaHeroStatsState) => state.mmrPercentiles ?? [],
);

export const getAllTribes = createSelector(getMetaHeroStatsState, (state: MetaHeroStatsState) => state.allTribes);

export const getCurrentTimerFilter = createSelector(
	getMetaHeroStatsState,
	(state: MetaHeroStatsState) => state.currentTimePeriodSelection,
);

export const getCurrentPercentileFilter = createSelector(
	getMetaHeroStatsState,
	(state: MetaHeroStatsState) => state.currentPercentileSelection,
);

export const getCurrentTribesFilter = createSelector(
	getMetaHeroStatsState,
	(state: MetaHeroStatsState) => state.currentTribesSelection,
);
