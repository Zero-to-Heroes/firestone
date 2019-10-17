import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckEvents } from './deck-events';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardRemovedFromHandParser implements EventParser {
	constructor() {}

	applies(gameEvent: GameEvent): boolean {
		return gameEvent.type === GameEvent.CARD_REMOVED_FROM_HAND;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = cardId && controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = DeckManipulationHelper.findCardInZone(deck.hand, cardId, entityId);

		const previousHand = deck.hand;
		const newHand: readonly DeckCard[] = DeckManipulationHelper.removeSingleCardFromZone(
			previousHand,
			cardId,
			entityId,
		);
		const cardWithZone = Object.assign(new DeckCard(), card, {
			zone: 'SETASIDE',
		} as DeckCard);
		const previousOtherZone = deck.otherZone;
		const newOtherZone: readonly DeckCard[] = DeckManipulationHelper.addSingleCardToZone(
			previousOtherZone,
			cardWithZone,
		);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			hand: newHand,
			otherZone: newOtherZone,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return DeckEvents.CARD_REMOVED_FROM_HAND;
	}
}
