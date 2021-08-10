import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { cardsRevealedWhenDrawn, forceHideInfoWhenDrawnInfluencers, publicCardCreators } from '../../hs-utils';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardDrawParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.CARD_DRAW_FROM_DECK;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		//console.debug('drawing from deck', cardId, gameEvent);
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const card = this.helper.findCardInZone(deck.deck, cardId, entityId, true);

		const lastInfluencedByCardId = gameEvent.additionalData?.lastInfluencedByCardId ?? card.lastAffectedByCardId;

		const isCardDrawnBySecretPassage = forceHideInfoWhenDrawnInfluencers.includes(
			gameEvent.additionalData?.lastInfluencedByCardId,
		);
		const isCardInfoPublic =
			// Also includes a publicCardCreator so that cards drawn from deck when we know what they are (eg
			// Southsea Scoundrel) are flagged
			// Hide the info when card is drawn by Secret Passage? The scenario is:
			// 1. Add a card revealed when drawn to your deck
			// 2. Cast Secret Passage: the card is added to your hand, but the "cast when drawn" effect doesn't trigger
			// (no idea why it behaves like that)
			// 3. As a result, the card info is considered public, and we show it
			isPlayer ||
			(!isCardDrawnBySecretPassage &&
				(cardsRevealedWhenDrawn.includes(cardId) || publicCardCreators.includes(lastInfluencedByCardId)));
		const isCreatorPublic = isCardInfoPublic || publicCardCreators.includes(lastInfluencedByCardId);

		//console.debug('found card in zone', card, deck, cardId, entityId, isCardInfoPublic);

		const creatorCardId = gameEvent.additionalData?.creatorCardId;
		const cardWithCreator = card.update({
			creatorCardId: isCardInfoPublic ? creatorCardId : undefined,
			cardId: isCardInfoPublic ? card.cardId : undefined,
			cardName: isCardInfoPublic ? card.cardName : undefined,
			lastAffectedByCardId: isCreatorPublic ? lastInfluencedByCardId : undefined,
		} as DeckCard);
		//console.debug('cardWithCreator', cardWithCreator, isCreatorPublic, publicCardCreators, lastInfluencedByCardId);
		const previousDeck = deck.deck;

		const newDeck: readonly DeckCard[] = isCardInfoPublic
			? this.helper.removeSingleCardFromZone(previousDeck, cardId, entityId, deck.deckList.length === 0, true)[0]
			: this.helper.removeSingleCardFromZone(previousDeck, null, -1, deck.deckList.length === 0, true)[0];
		//console.debug('newDeck', newDeck, isCardInfoPublic, previousDeck);
		const previousHand = deck.hand;
		const newHand: readonly DeckCard[] = this.helper.addSingleCardToZone(previousHand, cardWithCreator);
		//console.debug('added card to hand', newHand);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			deck: newDeck,
			hand: newHand,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.CARD_DRAW_FROM_DECK;
	}
}
