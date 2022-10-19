/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { ReplaysState } from '../../../models/mainwindow/replays/replays-state';
import { StatsState } from '../../../models/mainwindow/stats/stats-state';
import { PreferencesService } from '../../preferences.service';

@Injectable()
export class ReplaysStateBuilderService {
	constructor(private readonly prefs: PreferencesService, private readonly allCards: CardsFacadeService) {}

	// TODO: do we still need this?
	public async buildState(replayState: ReplaysState, stats: StatsState): Promise<ReplaysState> {
		if (!stats || !stats.gameStats || !stats.gameStats.stats) {
			console.error('Could not build replay state from empty stats', stats);
			return replayState;
		}
		const state = Object.assign(new ReplaysState(), replayState, {
			isLoading: false,
		} as ReplaysState);
		return state;
	}
}
