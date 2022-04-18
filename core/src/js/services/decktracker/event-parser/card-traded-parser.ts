import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

const CARDS_THAT_IMPROVE_WHEN_TRADED = [CardIds.AmuletOfUndying, CardIds.BlacksmithingHammer, CardIds.WickedShipment];

export class CardTradedParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.TRADE_CARD;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = this.helper.findCardInZone(deck.hand, cardId, entityId);

		const newHand: readonly DeckCard[] = this.helper.removeSingleCardFromZone(
			deck.hand,
			card.cardId,
			card.entityId,
		)[0];
		const previousDeck = deck.deck;
		// When we have a deckstring / decklist, we show all the possible remaining options in the
		// decklist. This means that when a filler card goes back, it's one of these initial cards
		// that goes back, and so we don't add them once again
		const shouldKeepDeckAsIs = deck.deckstring && card?.inInitialDeck && !card?.cardId;

		// This is to avoid the scenario where a card is drawn by a public influence (eg Thistle Tea) and
		// put back in the deck, then drawn again. If we don't reset the lastInfluencedBy, we
		// could possibly have an info leak
		const cardWithoutInfluence = card
			? card.update({
					lastAffectedByCardId: undefined,
					mainAttributeChange: buildAttributeChange(card),
			  } as DeckCard)
			: card;

		const newDeck: readonly DeckCard[] = shouldKeepDeckAsIs
			? previousDeck
			: this.helper.addSingleCardToZone(previousDeck, cardWithoutInfluence);
		// Because we don't know where the card is inserted, we reset the positions
		const deckWithResetPositions: readonly DeckCard[] = newDeck.map((card) =>
			card.update({
				...card,
				positionFromBottom: undefined,
				positionFromTop: undefined,
			}),
		);

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
