/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { DeckSummary } from '../../../models/mainwindow/decktracker/deck-summary';
import { DecktrackerState } from '../../../models/mainwindow/decktracker/decktracker-state';
import { ReplaysState } from '../../../models/mainwindow/decktracker/replays-state';
import { StatsState } from '../../../models/mainwindow/stats/stats-state';
import { DecksStateBuilderService } from './decks-state-builder.service';
import { ReplaysStateBuilderService } from './replays-state-builder.service';

@Injectable()
export class DecktrackerStateLoaderService {
	constructor(
		private readonly decksStateBuilder: DecksStateBuilderService,
		private readonly replaysStateBuilder: ReplaysStateBuilderService,
		private readonly logger: NGXLogger,
	) {}

	public buildState(currentState: DecktrackerState, stats: StatsState): DecktrackerState {
		const decks: readonly DeckSummary[] = this.decksStateBuilder.buildState(stats);
		const replayState: ReplaysState = this.replaysStateBuilder.buildState(currentState.replayState, stats);
		return Object.assign(new DecktrackerState(), currentState, {
			decks: decks,
			replayState: replayState,
		} as DecktrackerState);
	}
}
