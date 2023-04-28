import { Action, createReducer, on } from '@ngrx/store';

import * as WebsiteProfileActions from './pofile.actions';
import { WebsiteProfileState } from './profile.models';

export const WEBSITE_PROFILE_FEATURE_KEY = 'websiteProfile';

export interface WebsiteProfilePartialState {
	readonly [WEBSITE_PROFILE_FEATURE_KEY]: WebsiteProfileState;
}


export const initialWebsiteDuelsState: WebsiteProfileState = {
	loaded: false,
};

const reducer = createReducer(
	initialWebsiteDuelsState,

	on(WebsiteProfileActions.initProfileData, (state) => ({ ...state, loaded: false, error: null })),
	on(WebsiteProfileActions.initOwnProfileData, (state) => ({ ...state, loaded: false, error: null })),
	on(WebsiteProfileActions.loadProfileDataSuccess, (state, { sets }) => ({
		...state,
		sets: sets,
		loaded: true,
	})),
	on(WebsiteProfileActions.loadProfileDataFailure, (state, { error }) => ({ ...state, error })),
);

export function websiteDuelsReducer(state: WebsiteProfileState | undefined, action: Action) {
	return reducer(state, action);
}
