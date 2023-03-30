import { LocalStorageService } from '@firestone/shared/framework/core';
import { Action, createReducer, on } from '@ngrx/store';
import { WebsitePreferencesService } from '../../preferences/website-preferences.service';
import { isValidPremium } from '../../security/authentication.service';
import * as CoreActions from './core.actions';
import { WebsiteCoreState } from './core.models';

export const WEBSITE_CORE_FEATURE_KEY = 'websiteCore';

export interface WebsiteCorePartialState {
	readonly [WEBSITE_CORE_FEATURE_KEY]: WebsiteCoreState;
}

const localPrefsService = new WebsitePreferencesService(new LocalStorageService());
const localPrefs = localPrefsService.getPreferences();
export const initialWebsiteCoreState: WebsiteCoreState = {
	loaded: true,
	isPremium: isValidPremium(localPrefs.premium),
};

const reducer = createReducer(
	initialWebsiteCoreState,
	// on(CoreActions.initAuthentication, (state, { }))
	on(CoreActions.authenticationSuccess, (state, { userName, isLoggedIn, isPremium }) => ({
		...state,
		isPremium: isPremium,
		isLoggedIn: isLoggedIn,
		userName: userName,
	})),
);

export function websiteCoreReducer(state: WebsiteCoreState | undefined, action: Action) {
	return reducer(state, action);
}
