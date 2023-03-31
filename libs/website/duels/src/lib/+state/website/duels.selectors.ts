import { createFeatureSelector, createSelector } from '@ngrx/store';
import { WEBSITE_DUELS_FEATURE_KEY, WebsiteDuelsState, websiteDuelsAdapter } from './website/duels.reducer';

// Lookup the 'WebsiteDuels' feature state managed by NgRx
export const getWebsiteDuelsState = createFeatureSelector<WebsiteDuelsState>(WEBSITE_DUELS_FEATURE_KEY);

const { selectAll, selectEntities } = websiteDuelsAdapter.getSelectors();

export const getWebsiteDuelsLoaded = createSelector(getWebsiteDuelsState, (state: WebsiteDuelsState) => state.loaded);

export const getWebsiteDuelsError = createSelector(getWebsiteDuelsState, (state: WebsiteDuelsState) => state.error);

export const getAllWebsiteDuels = createSelector(getWebsiteDuelsState, (state: WebsiteDuelsState) => selectAll(state));

export const getWebsiteDuelsEntities = createSelector(getWebsiteDuelsState, (state: WebsiteDuelsState) =>
	selectEntities(state),
);

export const getSelectedId = createSelector(getWebsiteDuelsState, (state: WebsiteDuelsState) => state.selectedId);

export const getSelected = createSelector(getWebsiteDuelsEntities, getSelectedId, (entities, selectedId) =>
	selectedId ? entities[selectedId] : undefined,
);
