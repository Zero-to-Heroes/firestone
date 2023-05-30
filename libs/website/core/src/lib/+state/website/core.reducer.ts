import { LocalStorageService } from '@firestone/shared/framework/core';
import { Action, createReducer, on } from '@ngrx/store';
import { PremiumInfo } from '../../preferences/website-preferences';
import { WebsitePreferencesService } from '../../preferences/website-preferences.service';
import * as CoreActions from './core.actions';
import { WebsiteCoreState } from './core.models';

console.log('creating feature key');
export const WEBSITE_CORE_FEATURE_KEY = 'websiteCore';

// TODO: move this?
const isValidPremium = (premium: PremiumInfo): boolean => {
	console.log(
		'isValidPremium?',
		premium,
		premium?.isPremium,
		premium?.expires,
		Date.now() - (premium?.expires ?? 0) * 1000,
		window.location,
	);
	return premium?.isPremium && !!premium.expires && Date.now() - premium.expires * 1000 < 7 * 24 * 3600 * 1000;
};

export interface WebsiteCorePartialState {
	readonly [WEBSITE_CORE_FEATURE_KEY]: WebsiteCoreState;
}

const localPrefsService = new WebsitePreferencesService(new LocalStorageService());
const localPrefs = localPrefsService.getPreferences();
console.debug('localPrefs', localPrefs, localPrefs.premium?.fsToken);
export const initialWebsiteCoreState: WebsiteCoreState = {
	loaded: true,
	isPremium: isValidPremium(localPrefs.premium),
	nickName: localPrefs.premium?.nickName,
	userName: localPrefs.premium?.userName,
	isLoggedIn: localPrefs.premium?.isPremium,
	picture: localPrefs.premium?.picture,
	fsToken: localPrefs.premium?.fsToken,
};

const reducer = createReducer(
	initialWebsiteCoreState,
	// on(CoreActions.initAuthentication, (state, { }))
	on(CoreActions.afterAuthentication, (state, { userName, isLoggedIn, isPremium, nickName }) => ({
		...state,
		isPremium: isPremium,
		isLoggedIn: isLoggedIn,
		userName: userName as string,
		nickName: nickName as string,
	})),
);

export function websiteCoreReducer(state: WebsiteCoreState | undefined, action: Action) {
	return reducer(state, action);
}
