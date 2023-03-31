import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { createReducer, on, Action } from '@ngrx/store';

import * as WebsiteDuelsActions from './website/duels.actions';
import { WebsiteDuelsEntity } from './website/duels.models';

export const WEBSITE_DUELS_FEATURE_KEY = 'websiteDuels';

export interface WebsiteDuelsState extends EntityState<WebsiteDuelsEntity> {
	selectedId?: string | number; // which WebsiteDuels record has been selected
	loaded: boolean; // has the WebsiteDuels list been loaded
	error?: string | null; // last known error (if any)
}

export interface WebsiteDuelsPartialState {
	readonly [WEBSITE_DUELS_FEATURE_KEY]: WebsiteDuelsState;
}

export const websiteDuelsAdapter: EntityAdapter<WebsiteDuelsEntity> = createEntityAdapter<WebsiteDuelsEntity>();

export const initialWebsiteDuelsState: WebsiteDuelsState = websiteDuelsAdapter.getInitialState({
	// set initial required properties
	loaded: false,
});

const reducer = createReducer(
	initialWebsiteDuelsState,
	on(WebsiteDuelsActions.initWebsiteDuels, (state) => ({ ...state, loaded: false, error: null })),
	on(WebsiteDuelsActions.loadWebsiteDuelsSuccess, (state, { websiteDuels }) =>
		websiteDuelsAdapter.setAll(websiteDuels, { ...state, loaded: true }),
	),
	on(WebsiteDuelsActions.loadWebsiteDuelsFailure, (state, { error }) => ({ ...state, error })),
);

export function websiteDuelsReducer(state: WebsiteDuelsState | undefined, action: Action) {
	return reducer(state, action);
}
