/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { Preferences } from '@firestone/shared/common/service';
import { DeckFilters } from '../../../models/mainwindow/decktracker/deck-filters';
import { DecktrackerState } from '../../../models/mainwindow/decktracker/decktracker-state';

@Injectable()
export class DecktrackerStateLoaderService {
	public buildState(
		currentState: DecktrackerState,
		// config: ConstructedConfig = null,
		// patch: PatchInfo = null,
		prefs: Preferences = null,
	): DecktrackerState {
		const existingFilters = prefs?.desktopDeckFilters ?? currentState.filters ?? new DeckFilters();
		const filters: DeckFilters = {
			gameFormat: existingFilters.gameFormat ?? 'all',
			gameMode: existingFilters.gameMode ?? 'ranked',
			time: existingFilters.time ?? 'all-time',
			sort: existingFilters.sort ?? 'last-played',
			rank: existingFilters.rank ?? 'all',
			rankingGroup: existingFilters.rankingGroup ?? 'per-match',
			rankingCategory: existingFilters.rankingCategory ?? 'leagues',
		};
		// patch = patch || currentState.patch;
		return currentState.update({
			filters: filters,
			isLoading: false,
			// patch: patch,
			// config: config ?? currentState.config,
			initComplete: true,
		});
	}
}
