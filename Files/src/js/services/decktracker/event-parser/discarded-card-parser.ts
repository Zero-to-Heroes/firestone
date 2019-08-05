import { EventParser } from './event-parser';
import { GameEvent } from '../../../models/game-event';
import { GameState } from '../../../models/decktracker/game-state';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { DeckEvents } from './deck-events';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export class DiscardedCardParser implements EventParser {
	constructor() {}

	applies(gameEvent: GameEvent): boolean {
		if (gameEvent.type !== GameEvent.DISCARD_CARD) {
			return false;
		}
		const cardId: string = gameEvent.cardId;
		const controllerId: number = gameEvent.controllerId;
		const localPlayer = gameEvent.localPlayer;
		return cardId && controllerId === localPlayer.PlayerId;
	}

	parse(currentState: GameState, gameEvent: GameEvent): GameState {
		if (currentState.playerDeck.deckList.length === 0) {
			return currentState;
		}
		const cardId: string = gameEvent.cardId;
		const entityId: number = gameEvent.entityId;
		const card = DeckManipulationHelper.findCardInZone(currentState.playerDeck.hand, cardId, entityId);
		const newHand: readonly DeckCard[] = DeckManipulationHelper.removeSingleCardFromZone(
			currentState.playerDeck.hand,
			card.cardId,
			entityId,
		);
		const cardWithZone = Object.assign(new DeckCard(), card, {
			zone: 'DISCARD',
		} as DeckCard);
		const newOther: readonly DeckCard[] = DeckManipulationHelper.addSingleCardToZone(currentState.playerDeck.otherZone, cardWithZone);
		const newPlayerDeck = Object.assign(new DeckState(), currentState.playerDeck, {
			hand: newHand,
			otherZone: newOther,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			playerDeck: newPlayerDeck,
		});
	}

	event(): string {
		return DeckEvents.DISCARD_CARD;
	}
}
