import { isBattlegrounds } from '@firestone-hs/reference-data';
import { MemoryInspectionService } from '@firestone/memory';
import { GameState } from '../../../../models/game-state';
import { GameEvent } from '../../game-event';

import { GameStateEvent } from '../../../game-state-events/game-state-event';
import { GameEventsEmitterService } from '../../game-events-emitter.service';
import { EventParser } from '../_event-parser';

export class BgsActivePlayerBoardTriggerParser implements EventParser {
	constructor(private readonly memory: MemoryInspectionService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state && isBattlegrounds(state.metadata?.gameType);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		return currentState;
	}

	async sideEffects(gameEvent: GameEvent | GameStateEvent, eventsEmtter: GameEventsEmitterService) {
		const playerTeams = await this.memory.getBgsPlayerBoard();
		console.debug(
			'[bgs-simulation] BATTLEGROUNDS_ACTIVE_PLAYER_BOARD snapshot player board',
			// gameEvent.additionalData.playerBoard.board,
			gameEvent,
			playerTeams,
		);
		if (
			playerTeams?.Teammate?.Hero?.CardId &&
			playerTeams.Teammate.Hero.CardId !== playerTeams.Player?.Hero.CardId
		) {
			console.debug('player teams from memory', playerTeams);
			eventsEmtter.allEvents.next({
				type: GameEvent.BATTLEGROUNDS_ACTIVE_PLAYER_BOARD_PROCESS,
				additionalData: {
					playerTeams: playerTeams,
				},
			} as GameEvent);
		}
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_ACTIVE_PLAYER_BOARD;
	}
}
