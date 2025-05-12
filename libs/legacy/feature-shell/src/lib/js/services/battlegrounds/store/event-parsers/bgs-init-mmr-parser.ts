import { EventEmitter } from '@angular/core';
import { BattlegroundsState, BgsGame, GameState } from '@firestone/game-state';
import { MemoryInspectionService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { GameStateService } from '../../../decktracker/game-state.service';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsInitMmrEvent } from '../events/bgs-init-mmr-event';
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

		return currentState.update({
			currentGame: currentState.currentGame.update({
				mmrAtStart: mmr,
			} as BgsGame),
		} as BattlegroundsState);
	}
}
