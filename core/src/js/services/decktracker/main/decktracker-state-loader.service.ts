/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { DeckFilters } from '../../../models/mainwindow/decktracker/deck-filters';
import { DeckSummary } from '../../../models/mainwindow/decktracker/deck-summary';
import { DecktrackerState } from '../../../models/mainwindow/decktracker/decktracker-state';
import { StatsState } from '../../../models/mainwindow/stats/stats-state';
import { PatchInfo } from '../../../models/patches';
import { Preferences } from '../../../models/preferences';
import { DecksStateBuilderService } from './decks-state-builder.service';

@Injectable()
export class DecktrackerStateLoaderService {
	constructor(private readonly decksStateBuilder: DecksStateBuilderService) {}

	public buildState(
		currentState: DecktrackerState,
		stats: StatsState,
		patch: PatchInfo = null,
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
		};
		const decks: readonly DeckSummary[] = this.decksStateBuilder.buildState(stats, filters, patch, prefs);
		patch = patch || currentState.patch;
		return Object.assign(new DecktrackerState(), currentState, {
			decks: decks,
			filters: filters,
			isLoading: false,
			showHiddenDecks: prefs?.desktopDeckShowHiddenDecks ?? false,
			patch: patch,
		} as DecktrackerState);
	}
}
