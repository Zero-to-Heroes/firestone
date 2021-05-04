import { BoardSecret } from '../../../models/decktracker/board-secret';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class SecretDestroyedParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	// Whenever something occurs that publicly reveal a card, we try to assign its
	// cardId to the corresponding entity
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.SECRET_DESTROYED;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		// console.log('destroying secrets', deck, isPlayer, currentState, gameEvent);
		// console.log('current secrets', deck.secrets, entityId);

		const newSecrets: readonly BoardSecret[] = deck.secrets.filter((secret) => secret.entityId !== entityId);

		const newPlayerDeck = deck.update({
			secrets: newSecrets,
		} as DeckState);
		// console.log('[secret-triggered] new deck', entityId, newPlayerDeck);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.SECRET_DESTROYED;
	}
}
