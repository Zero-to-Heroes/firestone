import { DuelsMetaStats } from '@firestone/duels/view';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { WebsiteDuelsState } from './duels.models';
import { WEBSITE_DUELS_FEATURE_KEY } from './duels.reducer';

// Lookup the 'WebsiteDuels' feature state managed by NgRx
export const getWebsiteDuelsState = createFeatureSelector<WebsiteDuelsState>(WEBSITE_DUELS_FEATURE_KEY);

export const getAllMetaHeroStats = createSelector(
	getWebsiteDuelsState,
	(state: WebsiteDuelsState) => state.stats as readonly DuelsMetaStats[],
);

export const getMmrPercentiles = createSelector(
	getWebsiteDuelsState,
	(state: WebsiteDuelsState) => state.mmrPercentiles ?? [],
);

export const getCurrentPercentileFilter = createSelector(
	getWebsiteDuelsState,
	(state: WebsiteDuelsState) => state.currentPercentileSelection,
);
