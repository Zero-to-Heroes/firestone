import { DeckCard, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
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
		return !!state;
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

		// When reconnecting, it can happen that a minion that died when we were reconnecting is now created
		// directly in the graveyard
		const { zone: existingZone, card: existingCard } = deck.findCard(entityId) ?? { zone: null, card: null };

		let board = deck.board;
		if (!!existingCard && existingZone === 'board') {
			board = this.helper.removeSingleCardFromZone(board ?? [], existingCard.cardId, existingCard.entityId)[0];
		}
		let hand = deck.hand;
		let additionalKnownCardsInHand = deck.additionalKnownCardsInHand;
		if (!!existingCard && existingZone === 'hand') {
			hand = this.helper.removeSingleCardFromZone(hand ?? [], existingCard.cardId, existingCard.entityId)[0];
			additionalKnownCardsInHand = additionalKnownCardsInHand.filter((c) => c !== existingCard.cardId);
		}

		const cardWithDefault = DeckCard.create({
			cardId: cardId,
			entityId: entityId,
			cardName: cardData?.name,
			refManaCost: cardData?.cost,
			rarity: cardData?.rarity?.toLowerCase(),
			creatorCardId: creatorCardId,
			creatorEntityId: gameEvent.additionalData.creatorEntityId,
			lastAffectedByEntityId: gameEvent.additionalData.lastAffectedByEntityId,
		} as DeckCard);
		const newOther = this.helper.addSingleCardToOtherZone(deck.otherZone, cardWithDefault, this.allCards);

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
			board: board,
			hand: hand,
			additionalKnownCardsInHand: additionalKnownCardsInHand,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.CREATE_CARD_IN_GRAVEYARD;
	}
}
