import { CardIds } from '@firestone-hs/reference-data';
import { publicCardCreators } from '@services/hs-utils';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class EntityUpdateParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly i18n: LocalizationFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.ENTITY_UPDATE;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const cardInHand = this.helper.findCardInZone(deck.hand, null, entityId);

		const cardInDeck = this.helper.findCardInZone(deck.deck, null, entityId);
		const cardInOther = this.helper.findCardInZone(deck.otherZone, null, entityId);

		const shouldShowCardIdInHand =
			// If we don't restrict it to the current player, we create some info leaks in the opponent's hand (eg with Baku)
			cardInHand &&
			cardInHand.cardId !== cardId &&
			// Introduced for Lorewalker Cho
			(isPlayer || publicCardCreators.includes(cardInHand.creatorCardId as CardIds));

		const newCardInHand = shouldShowCardIdInHand
			? cardInHand.update({ cardId: cardId, cardName: this.i18n.getCardName(cardId) } as DeckCard)
			: null;

		const newCardInDeck =
			cardInDeck && cardInDeck.cardId !== cardId
				? cardInDeck.update({ cardId: cardId, cardName: this.i18n.getCardName(cardId) } as DeckCard)
				: null;
		const newCardInOther =
			cardInOther && cardInOther.cardId !== cardId
				? cardInOther.update({ cardId: cardId, cardName: this.i18n.getCardName(cardId) } as DeckCard)
				: null;

		const newHand = newCardInHand ? this.helper.replaceCardInZone(deck.hand, newCardInHand) : deck.hand;

		const newDeck = newCardInDeck ? this.helper.replaceCardInZone(deck.deck, newCardInDeck) : deck.deck;
		const newOther = newCardInOther
			? this.helper.replaceCardInZone(deck.otherZone, newCardInOther)
			: deck.otherZone;

		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			hand: newHand,
			deck: newDeck,
			otherZone: newOther,
		});

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.ENTITY_UPDATE;
	}
}
