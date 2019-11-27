/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { DeckFilters } from '../../../models/mainwindow/decktracker/deck-filters';
import { DeckSummary } from '../../../models/mainwindow/decktracker/deck-summary';
import { DecktrackerState } from '../../../models/mainwindow/decktracker/decktracker-state';
import { StatsState } from '../../../models/mainwindow/stats/stats-state';
import { DecksStateBuilderService } from './decks-state-builder.service';

@Injectable()
export class DecktrackerStateLoaderService {
	constructor(private readonly decksStateBuilder: DecksStateBuilderService, private readonly logger: NGXLogger) {}

	public buildState(currentState: DecktrackerState, stats: StatsState): DecktrackerState {
		const filters: DeckFilters = new DeckFilters();
		const decks: readonly DeckSummary[] = this.decksStateBuilder.buildState(stats, filters);
		return Object.assign(new DecktrackerState(), currentState, {
			decks: decks,
			filters: filters,
		} as DecktrackerState);
	}
}
