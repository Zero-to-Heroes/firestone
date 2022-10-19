/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { ConstructedConfig } from '../../../models/decktracker/constructed-config';
import { DeckFilters } from '../../../models/mainwindow/decktracker/deck-filters';
import { DecktrackerState } from '../../../models/mainwindow/decktracker/decktracker-state';
import { StatsState } from '../../../models/mainwindow/stats/stats-state';
import { PatchInfo } from '../../../models/patches';
import { Preferences } from '../../../models/preferences';
import { ApiRunner } from '../../api-runner';

const CONSTRUCTED_CONFIG_URL = 'https://static.firestoneapp.com/data/constructed-config.json';

@Injectable()
export class DecktrackerStateLoaderService {
	constructor(private readonly api: ApiRunner) {}

	public async loadConfig(): Promise<ConstructedConfig> {
		const result: ConstructedConfig = await this.api.callGetApi(CONSTRUCTED_CONFIG_URL);
		console.log('[constructed-state-builder] loaded constructed config');
		return result;
	}

	public buildState(
		currentState: DecktrackerState,
		stats: StatsState,
		config: ConstructedConfig = null,
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
			rankingCategory: existingFilters.rankingCategory ?? 'leagues',
		};
		patch = patch || currentState.patch;
		return Object.assign(new DecktrackerState(), currentState, {
			filters: filters,
			isLoading: false,
			patch: patch,
			config: config ?? currentState.config,
		} as DecktrackerState);
	}
}
