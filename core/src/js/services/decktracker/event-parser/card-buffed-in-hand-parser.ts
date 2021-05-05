import { AllCardsService } from '@firestone-hs/replay-parser';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardBuffedInHandParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: AllCardsService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.CARD_BUFFED_IN_HAND;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, controllerId, localPlayer, entityId] = gameEvent.parse();
		// console.log('buffing card in hand', cardId, controllerId, localPlayer, entityId, gameEvent);
		const buffingEntityCardId = gameEvent.additionalData.buffingEntityCardId;
		const buffCardId = gameEvent.additionalData.buffCardId;
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const cardInHand = this.helper.findCardInZone(deck.hand, null, entityId);
		// console.log('card in hand', cardInHand);
		const newCardInHand = cardInHand
			? cardInHand.update({
					buffingEntityCardIds: [
						...(cardInHand.buffingEntityCardIds || []),
						buffingEntityCardId,
					] as readonly string[],
					buffCardIds: [...(cardInHand.buffCardIds || []), buffCardId] as readonly string[],
			  } as DeckCard)
			: null;
		// console.log('newCardInHand', newCardInHand);

		const newHand = newCardInHand ? this.helper.replaceCardInZone(deck.hand, newCardInHand) : deck.hand;
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			hand: newHand,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.CARD_BUFFED_IN_HAND;
	}
}
