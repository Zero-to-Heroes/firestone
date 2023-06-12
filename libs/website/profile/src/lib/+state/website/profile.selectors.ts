import { createFeatureSelector, createSelector } from '@ngrx/store';
import { WebsiteProfileState } from './profile.models';
import { WEBSITE_PROFILE_FEATURE_KEY } from './profile.reducer';

export const getWebsiteProfileState = createFeatureSelector<WebsiteProfileState>(WEBSITE_PROFILE_FEATURE_KEY);

export const getLoaded = createSelector(getWebsiteProfileState, (state: WebsiteProfileState) => state.loaded);
export const getShareStatusMessage = createSelector(
	getWebsiteProfileState,
	(state: WebsiteProfileState) => state.shareStatusMessage,
);
export const isShowingShareModal = createSelector(
	getWebsiteProfileState,
	(state: WebsiteProfileState) => state.showingShareDialog,
);
export const getShareAlias = createSelector(getWebsiteProfileState, (state: WebsiteProfileState) => state.shareAlias);
export const getWatchingOtherPlayer = createSelector(
	getWebsiteProfileState,
	(state: WebsiteProfileState) => state.watchingOtherPlayer,
);

export const getSets = createSelector(
	getWebsiteProfileState,
	(state: WebsiteProfileState) => state.profile?.sets ?? [],
);

export const getAchievementCategories = createSelector(
	getWebsiteProfileState,
	(state: WebsiteProfileState) => state.profile?.achievementCategories ?? [],
);

export const getBgsHeroStats = createSelector(
	getWebsiteProfileState,
	(state: WebsiteProfileState) => state.profile?.bgFullTimeStatsByHero ?? [],
);
