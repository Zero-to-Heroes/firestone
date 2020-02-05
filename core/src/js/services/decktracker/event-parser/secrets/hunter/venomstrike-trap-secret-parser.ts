import { GameState } from '../../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../../models/game-event';
import { DeckManipulationHelper } from '../../deck-manipulation-helper';
import { EventParser } from '../../event-parser';

export class VenomstrikeTrapSecretParser implements EventParser {
	private readonly secretCardId = 'ICC_200';

	constructor(private readonly helper: DeckManipulationHelper) {}

	// Whenever something occurs that publicly reveal a card, we try to assign its
	// cardId to the corresponding entity
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.ATTACK_ON_MINION;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const attackedMinionControllerId = gameEvent.additionalData.targetControllerId;
		const isPlayerBeingAttacked = attackedMinionControllerId === gameEvent.localPlayer.PlayerId;
		const activePlayerId = gameEvent.gameState.ActivePlayerId;
		const deckWithSecretToCheck = isPlayerBeingAttacked ? currentState.playerDeck : currentState.opponentDeck;
		if (isPlayerBeingAttacked && activePlayerId === gameEvent.localPlayer.PlayerId) {
			return currentState;
		}
		if (!isPlayerBeingAttacked && activePlayerId === gameEvent.opponentPlayer.PlayerId) {
			return currentState;
		}
		// If board is full, secret can't trigger
		if (deckWithSecretToCheck.board.length === 7) {
			return currentState;
		}
		const newPlayerDeck = this.helper.removeSecretOption(deckWithSecretToCheck, this.secretCardId);
		return Object.assign(new GameState(), currentState, {
			[isPlayerBeingAttacked ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_VENOMSTRIKE_TRAP';
	}
}
