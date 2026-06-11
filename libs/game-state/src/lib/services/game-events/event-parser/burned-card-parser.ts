import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/deck-card';
import { GameState } from '../../../models/game-state';
import { revealCard } from '../card-reveal';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DeckManipulationHelper, resolveFallbackCreatorCardIdForDeckRemoval } from './deck-manipulation-helper';

export class BurnedCardParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		if (!cardId && !entityId) {
			return currentState;
		}

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const card = this.helper.findCardInZone(deck.deck, cardId, entityId)!;
		const previousDeck = deck.deck;
		const refCard = this.allCards.getCard(card.cardId);
		const fallbackCreatorCardId = resolveFallbackCreatorCardIdForDeckRemoval({
			handOrRemovedCard: card,
		});
		const newDeck: readonly DeckCard[] = this.helper.removeSingleCardFromZone(
			previousDeck,
			cardId,
			entityId,
			deck.deckList.length === 0,
			true,
			null,
			false,
			{ fallbackCreatorCardId },
		)[0];
		const cardWithZone = card.update({
			zone: 'BURNED',
			refManaCost: card.refManaCost ?? refCard.cost,
		} as DeckCard);
		const newOtherZone: readonly DeckCard[] = this.helper.addSingleCardToOtherZone(
			deck.otherZone,
			cardWithZone,
			this.allCards,
		);
		const additionalKnownCardsInDeck = deck.additionalKnownCardsInDeck.filter(
			(c, i) => c !== cardId || deck.additionalKnownCardsInDeck.indexOf(c) !== i,
		);
		const newPlayerDeck = deck.update({
			deck: newDeck,
			otherZone: newOtherZone,
			burnedCards: [...deck.burnedCards, { cardId, entityId }],
			additionalKnownCardsInDeck: additionalKnownCardsInDeck,
		});

		const playerDeckAfterReveal = isPlayer ? newPlayerDeck : currentState.playerDeck;
		const opponentDeckAfterReveal = isPlayer
			? currentState.opponentDeck
			: revealCard(newPlayerDeck, cardWithZone, this.allCards);

		return Object.assign(new GameState(), currentState, {
			playerDeck: playerDeckAfterReveal,
			opponentDeck: opponentDeckAfterReveal,
		});
	}

	event(): string {
		return GameEvent.BURNED_CARD;
	}
}
