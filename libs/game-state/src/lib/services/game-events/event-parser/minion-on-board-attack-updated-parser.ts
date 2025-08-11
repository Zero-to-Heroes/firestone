import { GameState } from '../../../models/game-state';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';

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
