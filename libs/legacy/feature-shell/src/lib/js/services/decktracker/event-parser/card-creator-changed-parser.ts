import { CardIds } from '@firestone-hs/reference-data';
import { reverseIfNeeded } from '@legacy-import/src/lib/js/services/decktracker/event-parser/card-dredged-parser';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { forcedHiddenCardCreators } from '../../hs-utils';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardCreatorChangedParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = reverseIfNeeded(controllerId === localPlayer.PlayerId, gameEvent.additionalData.creatorCardId);
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		// Issue: Mask of Mimicry has an info leak where it changes teh DISPLAYED_CREATOR tag
		// for cards in hand
		const cardInHand = this.helper.findCardInZone(deck.hand, null, entityId);
		const cardInDeck = this.helper.findCardInZone(deck.deck, null, entityId);

		// See receive-card-in-hand-parser
		const isSpecialCasePublic =
			!isPlayer && !forcedHiddenCardCreators.includes(gameEvent.additionalData.creatorCardId as CardIds);
		// || (isPlayer && !hideInfoWhenPlayerPlaysIt.includes(gameEvent.additionalData.creatorCardId as CardIds));
		const isCardInfoPublic = isPlayer || isSpecialCasePublic;
		const newCardInHand = cardInHand
			? cardInHand.update({
					// To avoid info leaks from Mask of Mimicry
					creatorCardId: isCardInfoPublic ? gameEvent.additionalData.creatorCardId : cardInHand.creatorCardId,
			  } as DeckCard)
			: null;
		const newCardInDeck = cardInDeck
			? cardInDeck.update({
					creatorCardId: gameEvent.additionalData.creatorCardId,
			  } as DeckCard)
			: null;

		const newHand = newCardInHand ? this.helper.replaceCardInZone(deck.hand, newCardInHand) : deck.hand;
		const newDeck = newCardInDeck ? this.helper.replaceCardInZone(deck.deck, newCardInDeck) : deck.deck;

		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			hand: newHand,
			deck: newDeck,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.CARD_CREATOR_CHANGED;
	}
}
