import { GameState } from '@firestone/game-state';
import { GameEvent } from '../../../../../../../../app/common/src/lib/services/game-events/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class MinionOnBoardAttackUpdatedParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		// Do it so that the attack counter is updated
		return currentState.update({});
	}

	event(): string {
		return GameEvent.MINION_ON_BOARD_ATTACK_UPDATED;
	}
}
