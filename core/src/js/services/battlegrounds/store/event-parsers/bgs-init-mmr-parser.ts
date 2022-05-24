import { EventEmitter } from '@angular/core';
import { BgsRankFilterSelectedEvent } from '@services/mainwindow/store/events/battlegrounds/bgs-rank-filter-selected-event';
import { BgsTribesFilterSelectedEvent } from '@services/mainwindow/store/events/battlegrounds/bgs-tribes-filter-selected-event';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { PreferencesService } from '@services/preferences.service';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameStateService } from '../../../decktracker/game-state.service';
import { MemoryInspectionService } from '../../../plugins/memory-inspection.service';
import { BgsInitMmrEvent } from '../events/bgs-init-mmr-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsInitMmrParser implements EventParser {
	constructor(
		private readonly memoryService: MemoryInspectionService,
		private readonly gameState: GameStateService,
		private readonly prefs: PreferencesService,
		private readonly stateUpdaterProvider: () => EventEmitter<MainWindowStoreEvent>,
	) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsInitMmrEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsInitMmrEvent,
		gameState?: GameState,
	): Promise<BattlegroundsState> {
		const bgsInfo = await this.memoryService.getBattlegroundsInfo();
		const reviewId = await this.gameState.getCurrentReviewId();
		const mmr = bgsInfo?.Rating;
		console.log('[bgs-mmr] mmrAtStart', reviewId, mmr);

		const prefs = await this.prefs.getPreferences();
		const stateUpdater = this.stateUpdaterProvider();
		if (prefs.bgsUseTribeFilterInHeroSelection) {
			if (!!currentState.currentGame?.availableRaces?.length) {
				stateUpdater.next(new BgsTribesFilterSelectedEvent(currentState.currentGame.availableRaces));
			} else {
				console.warn('[bgs-mmr] no available races', currentState?.currentGame?.availableRaces);
			}
		}

		if (prefs.bgsUseMmrFilterInHeroSelection) {
			const percentile = [...event.mmrPercentiles]
				.sort((a, b) => a.mmr - b.mmr)
				.find((percentile) => percentile.mmr <= (mmr ?? 0));
			if (!!percentile) {
				stateUpdater.next(new BgsRankFilterSelectedEvent(percentile.percentile));
			} else {
				console.warn('[bgs-mmr] no available percentile', event.mmrPercentiles, mmr);
			}
		}

		return currentState.update({
			currentGame: currentState.currentGame.update({
				mmrAtStart: mmr,
			} as BgsGame),
		} as BattlegroundsState);
	}
}
