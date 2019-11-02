import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckEvents } from './deck-events';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class BurnedCardParser implements EventParser {
	constructor() {}

	applies(gameEvent: GameEvent): boolean {
		return gameEvent.type === GameEvent.BURNED_CARD;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		if (!cardId && !entityId) {
			return currentState;
		}

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const card = DeckManipulationHelper.findCardInZone(deck.deck, cardId, entityId);
		const previousDeck = deck.deck;
		const newDeck: readonly DeckCard[] = DeckManipulationHelper.removeSingleCardFromZone(
			previousDeck,
			cardId,
			entityId,
		);
		const cardWithZone = Object.assign(new DeckCard(), card, {
			zone: 'BURNED',
		} as DeckCard);
		const previousOtherZone = deck.otherZone;
		const newOtherZone: readonly DeckCard[] = DeckManipulationHelper.addSingleCardToZone(
			previousOtherZone,
			cardWithZone,
		);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			deck: newDeck,
			otherZone: newOtherZone,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return DeckEvents.BURNED_CARD;
	}
}
