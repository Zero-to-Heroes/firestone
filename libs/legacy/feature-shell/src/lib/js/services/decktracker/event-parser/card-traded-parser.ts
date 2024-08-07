import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { GameEvent } from '../../../models/game-event';
import { CARDS_THAT_IMPROVE_WHEN_TRADED } from '../../hs-utils';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardTradedParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly prefs: PreferencesService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = this.helper.findCardInZone(
			deck.hand,
			// So that we don't create a fake cardId if we can't find the card, as this will trip the "shouldKeepDeckAsIs"
			// check
			isPlayer ? cardId : null,
			entityId,
		);
		console.debug('[card-traded] card in hand', card, cardId, entityId, deck.hand);

		const newHand: readonly DeckCard[] = this.helper.removeSingleCardFromZone(
			deck.hand,
			card.cardId,
			card.entityId,
		)[0];
		console.debug('[card-traded] new hand', newHand, card.cardId, card.entityId);
		const previousDeck = deck.deck;
		// When we have a deckstring / decklist, we show all the possible remaining options in the
		// decklist. This means that when a filler card goes back, it's one of these initial cards
		// that goes back, and so we don't add them once again
		const isInInitialDeck = !!card?.inInitialDeck || !card.creatorCardId?.length;
		const shouldKeepDeckAsIs = !!deck.deckstring && isInInitialDeck && !card?.cardId;
		console.debug(
			'[card-traded] shouldKeepDeckAsIs',
			shouldKeepDeckAsIs,
			deck.deckstring,
			isInInitialDeck,
			card?.inInitialDeck,
			card?.creatorCardId,
			card?.cardId,
			card?.entityId,
		);

		// This is to avoid the scenario where a card is drawn by a public influence (eg Thistle Tea) and
		// put back in the deck, then drawn again. If we don't reset the lastInfluencedBy, we
		// could possibly have an info leak
		const cardWithoutInfluence = card
			? card.update({
					entityId: card.entityId,
					cardId: card.cardId ?? cardId,
					lastAffectedByCardId: undefined,
					mainAttributeChange: buildAttributeChange(card),
					positionFromTop: undefined,
					positionFromBottom: undefined,
					dredged: undefined,
					zone: undefined,
			  } as DeckCard)
			: card;

		const newDeck: readonly DeckCard[] = shouldKeepDeckAsIs
			? previousDeck
			: this.helper.addSingleCardToZone(previousDeck, cardWithoutInfluence);

		const prefs = await this.prefs.getPreferences();
		// Because we don't know where the card is inserted, we reset the positions
		const deckWithResetPositions: readonly DeckCard[] = prefs.overlayResetDeckPositionAfterTrade2
			? newDeck.map((card) =>
					card.update({
						...card,
						positionFromBottom: undefined,
						positionFromTop: undefined,
						dredged: undefined,
					}),
			  )
			: newDeck;

		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			deck: deckWithResetPositions,
			hand: newHand,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.TRADE_CARD;
	}
}

const buildAttributeChange = (card: DeckCard): number => {
	if (CARDS_THAT_IMPROVE_WHEN_TRADED.includes(card?.cardId as CardIds)) {
		return 1 + (card.mainAttributeChange ?? 0);
	}
	return null;
};
