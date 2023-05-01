import { createFeatureSelector, createSelector } from '@ngrx/store';
import { WebsiteCoreState } from './core.models';
import { WEBSITE_CORE_FEATURE_KEY } from './core.reducer';

// Lookup the 'WebsiteCore' feature state managed by NgRx
console.log('getting corestate');
export const getWebsiteCoreState = createFeatureSelector<WebsiteCoreState>(WEBSITE_CORE_FEATURE_KEY);

export const getPremium = createSelector(getWebsiteCoreState, (state: WebsiteCoreState) => state.isPremium);
export const getUsername = createSelector(getWebsiteCoreState, (state: WebsiteCoreState) => state.userName);
export const getNickname = createSelector(getWebsiteCoreState, (state: WebsiteCoreState) => state.nickName);
export const getFsToken = createSelector(getWebsiteCoreState, (state: WebsiteCoreState) => state.fsToken);
