import { EventEmitter } from '@angular/core';
import { Race } from '@firestone-hs/reference-data';
import { PreferencesService } from '@legacy-import/src/lib/js/services/preferences.service';
import { BgsTribesFilterSelectedEvent } from '@services/mainwindow/store/events/battlegrounds/bgs-tribes-filter-selected-event';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsFilterLiveTribesEvent } from '../events/bgs-filter-live-tribes-event';
import { EventParser } from './_event-parser';

export class BgsFilterLiveTribesParser implements EventParser {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly stateUpdaterProvider: () => EventEmitter<MainWindowStoreEvent>,
	) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsFilterLiveTribesEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsFilterLiveTribesEvent,
		gameState?: GameState,
	): Promise<BattlegroundsState> {
		const tribesFilter: readonly Race[] = currentState.currentGame.availableRaces;
		const stateUpdater = this.stateUpdaterProvider();
		stateUpdater.next(new BgsTribesFilterSelectedEvent(tribesFilter));
		return currentState;
	}
}
