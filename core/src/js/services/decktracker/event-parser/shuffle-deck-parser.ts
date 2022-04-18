import { DeckCard } from '../../../models/decktracker/deck-card';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class ShuffleDeckParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.SHUFFLE_DECK;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, , localPlayer] = gameEvent.parse();
		const playerId = gameEvent.additionalData.playerId;
		const isPlayer = playerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const newDeck: readonly DeckCard[] = deck.deck.map((card) =>
			card.update({
				...card,
				positionFromBottom: undefined,
				positionFromTop: undefined,
			}),
		);
		const newPlayerDeck = deck.update({
			deck: newDeck,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.SHUFFLE_DECK;
	}
}
