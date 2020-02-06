import { GameState } from '../../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../../models/game-event';
import { DeckManipulationHelper } from '../../deck-manipulation-helper';
import { EventParser } from '../../event-parser';

export class MisdirectionSecretParser implements EventParser {
	private readonly secretCardId = 'EX1_533';

	constructor(private readonly helper: DeckManipulationHelper) {}

	// Whenever something occurs that publicly reveal a card, we try to assign its
	// cardId to the corresponding entity
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.ATTACKING_HERO;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const defenderPlayerControllerId = gameEvent.additionalData.defenderControllerId;
		const isPlayedBeingAttacked = defenderPlayerControllerId === gameEvent.localPlayer.PlayerId;
		const activePlayerId = gameEvent.gameState.ActivePlayerId;
		const deckWithSecretToCheck = isPlayedBeingAttacked ? currentState.playerDeck : currentState.opponentDeck;
		if (isPlayedBeingAttacked && activePlayerId === gameEvent.localPlayer.PlayerId) {
			return currentState;
		}
		if (!isPlayedBeingAttacked && activePlayerId === gameEvent.opponentPlayer.PlayerId) {
			return currentState;
		}
		const newPlayerDeck = this.helper.removeSecretOption(deckWithSecretToCheck, this.secretCardId);
		return Object.assign(new GameState(), currentState, {
			[isPlayedBeingAttacked ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_MISDIRECTION';
	}
}
