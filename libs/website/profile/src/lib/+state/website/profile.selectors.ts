import { createFeatureSelector, createSelector } from '@ngrx/store';
import { WebsiteProfileState } from './profile.models';
import { WEBSITE_PROFILE_FEATURE_KEY } from './profile.reducer';

export const getWebsiteProfileState = createFeatureSelector<WebsiteProfileState>(WEBSITE_PROFILE_FEATURE_KEY);

export const getLoaded = createSelector(getWebsiteProfileState, (state: WebsiteProfileState) => state.loaded);

export const getSets = createSelector(
	getWebsiteProfileState,
	(state: WebsiteProfileState) => state.sets ?? [],
);
