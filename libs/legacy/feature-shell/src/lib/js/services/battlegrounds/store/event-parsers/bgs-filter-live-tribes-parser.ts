import { EventEmitter } from '@angular/core';
import { ALL_BG_RACES, Race } from '@firestone-hs/reference-data';
import { PreferencesService } from '@legacy-import/src/lib/js/services/preferences.service';
import { BgsTribesFilterSelectedEvent } from '@services/mainwindow/store/events/battlegrounds/bgs-tribes-filter-selected-event';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { BgsFilterLiveTribesEvent } from '../events/bgs-filter-live-tribes-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
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
		const prefs = await this.prefs.getPreferences();
		await this.prefs.savePreferences({ ...prefs, bgsUseTribeFilterInHeroSelection: event.filterByLiveTribes });

		const tribesFilter: readonly Race[] = event.filterByLiveTribes
			? currentState.currentGame.availableRaces
			: ALL_BG_RACES;
		const stateUpdater = this.stateUpdaterProvider();
		stateUpdater.next(new BgsTribesFilterSelectedEvent(tribesFilter));
		return currentState;
	}
}
