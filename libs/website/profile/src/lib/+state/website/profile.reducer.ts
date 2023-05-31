/* eslint-disable no-mixed-spaces-and-tabs */
import { LocalStorageService } from '@firestone/shared/framework/core';
import { WebsitePreferences } from '@firestone/website/core';
import { Action, createReducer, on } from '@ngrx/store';
import * as WebsiteProfileActions from './pofile.actions';
import { WebsiteProfileState } from './profile.models';

export const WEBSITE_PROFILE_FEATURE_KEY = 'websiteProfile';

export interface WebsiteProfilePartialState {
	readonly [WEBSITE_PROFILE_FEATURE_KEY]: WebsiteProfileState;
}

// Using the WebsitePreferencesService wrapper here causes an exception on init,
// though I don't understand why
const localPrefs: WebsitePreferences = new LocalStorageService().getItem(
	LocalStorageService.LOCAL_STORAGE_USER_PREFERENCES,
);
console.debug('localPrefs', localPrefs?.shareAlias);
export const initialState: WebsiteProfileState = {
	loaded: true,
	shareAlias: localPrefs?.shareAlias,
};

const reducer = createReducer(
	initialState,

	on(WebsiteProfileActions.initProfileData, (state) => ({ ...state, loaded: false, error: null })),
	// Only load once

	on(WebsiteProfileActions.initOwnProfileData, (state) =>
		!!state.profile ? state : { ...state, loaded: false, error: null },
	),
	on(WebsiteProfileActions.loadProfileDataSuccess, (state, { profile, shareAlias }) => ({
		...state,
		profile: profile,
		shareAlias: shareAlias,
		loaded: true,
	})),
	on(WebsiteProfileActions.loadProfileDataFailure, (state, { error }) => ({ ...state, error })),

	on(WebsiteProfileActions.initOtherProfileData, (state, { shareAlias }) =>
		!!state.profile
			? state
			: {
					...state,
					watchingOtherPlayer: shareAlias,
					loaded: false,
					error: null,
			  },
	),
	on(WebsiteProfileActions.loadOtherProfileDataSuccess, (state, { profile }) => ({
		...state,
		profile: profile,
		loaded: true,
	})),
	on(WebsiteProfileActions.stopWatchingOtherProfile, (state) => ({
		...state,
		profile: undefined,
		loaded: false,
		watchingOtherPlayer: undefined,
	})),

	on(WebsiteProfileActions.startProfileShare, (state) => ({ ...state, showingShareDialog: true })),
	on(WebsiteProfileActions.stopProfileShare, (state) => ({ ...state, showingShareDialog: false })),
	on(WebsiteProfileActions.shareProfile, (state) => ({ ...state, shareStatusMessage: 'sharing' })),
	on(WebsiteProfileActions.shareProfileSuccess, (state, { shareAlias }) => ({
		...state,
		shareStatusMessage: 'success',
		shareAlias: shareAlias,
	})),
	on(WebsiteProfileActions.shareProfileFailure, (state, { errorCode }) => ({
		...state,
		shareStatusMessage: errorCode === 409 ? 'existing-alias' : 'error',
	})),
	on(WebsiteProfileActions.unshareProfileSuccess, (state) => ({
		...state,
		shareStatusMessage: undefined,
		shareAlias: null,
	})),
);

export function websiteDuelsReducer(state: WebsiteProfileState | undefined, action: Action) {
	return reducer(state, action);
}
