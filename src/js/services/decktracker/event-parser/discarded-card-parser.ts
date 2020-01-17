import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckEvents } from './deck-events';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class DiscardedCardParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.DISCARD_CARD;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = this.helper.findCardInZone(deck.hand, cardId, entityId);

		const [newHand, removedCard] = this.helper.removeSingleCardFromZone(deck.hand, card.cardId, entityId);

		// See card-played-from-hand
		let newDeck = deck.deck;
		if (!isPlayer && currentState.opponentDeck.deckList && !removedCard.creatorCardId && !removedCard.cardId) {
			const result = this.helper.removeSingleCardFromZone(deck.deck, cardId, entityId);
			const removedFromDeck = result[1];
			newDeck = result[0];
		}

		const cardWithZone = card.update({
			zone: 'DISCARD',
		} as DeckCard);
		const newOther: readonly DeckCard[] = this.helper.addSingleCardToZone(deck.otherZone, cardWithZone);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			hand: newHand,
			otherZone: newOther,
			deck: newDeck,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return DeckEvents.DISCARD_CARD;
	}
}
