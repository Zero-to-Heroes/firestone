import { EventEmitter } from '@angular/core';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { PreferencesService } from '@services/preferences.service';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { BgsRankFilterSelectedEvent } from '../../../mainwindow/store/events/battlegrounds/bgs-rank-filter-selected-event';
import { BgsFilterLiveMmrEvent } from '../events/bgs-filter-live-mmr-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsFilterLiveMmrParser implements EventParser {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly stateUpdaterProvider: () => EventEmitter<MainWindowStoreEvent>,
	) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsFilterLiveMmrEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsFilterLiveMmrEvent,
		gameState?: GameState,
	): Promise<BattlegroundsState> {
		const prefs = await this.prefs.getPreferences();
		await this.prefs.savePreferences({ ...prefs, bgsUseMmrFilterInHeroSelection: event.filterByLiveMmr });

		const currentMmr = currentState.currentGame?.mmrAtStart ?? 0;
		const percentile = event.filterByLiveMmr
			? [...event.percentiles].sort((a, b) => b.mmr - a.mmr).find((percentile) => percentile.mmr <= currentMmr)
			: null;
		const stateUpdater = this.stateUpdaterProvider();
		stateUpdater.next(new BgsRankFilterSelectedEvent(percentile?.percentile ?? 100));
		return currentState;
	}
}
