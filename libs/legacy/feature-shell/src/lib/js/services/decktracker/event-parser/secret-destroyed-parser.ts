import { BoardSecret, DeckState, GameState } from '@firestone/game-state';
import { GameEvent } from '../../../../../../../../app/common/src/lib/services/game-events/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class SecretDestroyedParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	// Whenever something occurs that publicly reveal a card, we try to assign its
	// cardId to the corresponding entity
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const newSecrets: readonly BoardSecret[] = deck.secrets.filter((secret) => secret.entityId !== entityId);

		const newPlayerDeck = deck.update({
			secrets: newSecrets,
		} as DeckState);

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
			miscCardsDestroyed: [...(currentState.miscCardsDestroyed || []), cardId],
		});
	}

	event(): string {
		return GameEvent.SECRET_DESTROYED;
	}
}
