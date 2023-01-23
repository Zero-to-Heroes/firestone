import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CreateCardInGraveyardParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.CREATE_CARD_IN_GRAVEYARD;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const creatorCardId = gameEvent.additionalData.creatorCardId;

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		// const lastInfluencedByCardId = gameEvent.additionalData?.lastInfluencedByCardId;
		const cardData = cardId ? this.allCards.getCard(cardId) : null;
		// Because of how reconnects work, we don't know whether the card is an enchantment just
		// from the logs
		if (!cardId || cardData?.type === 'Enchantment') {
			return currentState;
		}

		const cardWithDefault = DeckCard.create({
			cardId: cardId,
			entityId: entityId,
			cardName: cardData && this.i18n.getCardName(cardData.id, cardData.name),
			manaCost: cardData && cardData.cost,
			rarity: cardData && cardData.rarity ? cardData.rarity.toLowerCase() : null,
			creatorCardId: creatorCardId,
			lastAffectedByEntityId: gameEvent.additionalData.lastAffectedByEntityId,
		} as DeckCard);
		const newOther = this.helper.addSingleCardToZone(deck.otherZone, cardWithDefault);

		let newDeck = deck.deck;
		// The Scythe words in a weird way, and creates the cards directly in the graveyard, instead of
		// first creating them in deck, then moving them
		const shouldRemoveFromInitialDeck = gameEvent.additionalData.shouldRemoveFromInitialDeck;
		if (shouldRemoveFromInitialDeck) {
			newDeck = this.helper.removeSingleCardFromZone(deck.deck, cardId, entityId)[0];
		}

		const newPlayerDeck = deck.update({
			otherZone: newOther,
			deck: newDeck,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.CREATE_CARD_IN_GRAVEYARD;
	}
}
