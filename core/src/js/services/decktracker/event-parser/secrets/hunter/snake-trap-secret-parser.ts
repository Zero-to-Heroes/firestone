import { GameState } from '../../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../../models/game-event';
import { DeckManipulationHelper } from '../../deck-manipulation-helper';
import { EventParser } from '../../event-parser';

export class SnakeTrapSecretParser implements EventParser {
	private readonly secretCardId = 'EX1_554';

	constructor(private readonly helper: DeckManipulationHelper) {}

	// Whenever something occurs that publicly reveal a card, we try to assign its
	// cardId to the corresponding entity
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.ATTACKING_MINION;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const defenderMinionControllerId = gameEvent.additionalData.defenderControllerId;
		const isPlayerBeingAttacked = defenderMinionControllerId === gameEvent.localPlayer.PlayerId;
		const activePlayerId = gameEvent.gameState.ActivePlayerId;
		const deckWithSecretToCheck = isPlayerBeingAttacked ? currentState.playerDeck : currentState.opponentDeck;
		if (isPlayerBeingAttacked && activePlayerId === gameEvent.localPlayer.PlayerId) {
			console.log('snake', 'active player being defender', isPlayerBeingAttacked, activePlayerId, gameEvent);
			return currentState;
		}
		if (!isPlayerBeingAttacked && activePlayerId === gameEvent.opponentPlayer.PlayerId) {
			console.log('snake', 'active opp being defender', isPlayerBeingAttacked, activePlayerId, gameEvent);
			return currentState;
		}
		// If board is full, secret can't trigger
		if (deckWithSecretToCheck.board.length === 7) {
			console.log('snake', 'board full', isPlayerBeingAttacked, deckWithSecretToCheck);
			return currentState;
		}
		const newPlayerDeck = this.helper.removeSecretOption(deckWithSecretToCheck, this.secretCardId);
		return Object.assign(new GameState(), currentState, {
			[isPlayerBeingAttacked ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_SNAKE_TRAP';
	}
}
