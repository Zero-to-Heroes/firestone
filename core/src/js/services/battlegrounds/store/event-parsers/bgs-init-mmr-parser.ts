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
