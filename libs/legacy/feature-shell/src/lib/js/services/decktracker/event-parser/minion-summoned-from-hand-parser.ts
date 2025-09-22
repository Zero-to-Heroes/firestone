import { GameTag } from '@firestone-hs/reference-data';
import { DeckCard, GameState, getProcessedCard, toTagsObject } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../../../../../../app/common/src/lib/services/game-events/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class MinionSummonedFromHandParser implements EventParser {
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

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = this.helper.findCardInZone(deck.hand, cardId, entityId);

		const [newHand, removedCard] = this.helper.removeSingleCardFromZone(
			deck.hand,
			cardId,
			entityId,
			deck.deckList.length === 0,
		);

		let newDeck = deck.deck;
		// removedCard != null ? this.helper.updateDeckForAi(gameEvent, currentState, removedCard) : deck.deck;

		// This happens when we create a card in the deck, then leave it there when the opponent draws it
		// (to avoid info leaks). When they play it we won't find it in the "hand" zone, so we try
		// and see if it is somewhere in the deck
		if (!removedCard?.cardId && cardId) {
			const [newDeckAfterReveal, removedCardFromDeck] = this.helper.removeSingleCardFromZone(
				newDeck,
				cardId,
				entityId,
				deck.deckList.length === 0,
			);

			if (removedCardFromDeck) {
				newDeck = newDeckAfterReveal;
			}
		}

		// Only minions end up on the board
		const refCard = getProcessedCard(cardId, entityId, deck, this.allCards);
		const isOnBoard = refCard && (refCard.type === 'Minion' || refCard.type === 'Location');
		const cardWithZone =
			card?.update({
				zone: isOnBoard ? 'PLAY' : null,
				temporaryCard: false,
				playTiming: isOnBoard ? GameState.playTiming++ : null,
				putIntoPlay: isOnBoard ? true : null,
				tags: toTagsObject(gameEvent.additionalData.tags),
				refManaCost: card?.refManaCost ?? refCard.cost ?? removedCard?.tags?.[GameTag.COST],
			}) ||
			DeckCard.create({
				entityId: entityId,
				cardId: cardId,
				cardName: refCard.name,
				refManaCost: refCard?.cost,
				rarity: refCard?.rarity?.toLowerCase(),
				zone: isOnBoard ? 'PLAY' : null,
				temporaryCard: false,
				playTiming: isOnBoard ? GameState.playTiming++ : null,
				putIntoPlay: isOnBoard ? true : null,
				tags: toTagsObject(gameEvent.additionalData.tags),
			});
		const newBoard: readonly DeckCard[] = isOnBoard
			? this.helper.addSingleCardToZone(deck.board, cardWithZone)
			: deck.board;
		const newOtherZone: readonly DeckCard[] = isOnBoard
			? deck.otherZone
			: this.helper.addSingleCardToOtherZone(deck.otherZone, cardWithZone, this.allCards);
		const newPlayerDeck = deck.update({
			hand: newHand,
			additionalKnownCardsInHand: deck.additionalKnownCardsInHand.filter((c) => c !== cardId),
			board: newBoard,
			deck: newDeck,
			otherZone: newOtherZone,
			// cardsPlayedThisTurn: [...deck.cardsPlayedThisTurn, cardWithZone] as readonly DeckCard[],
		});

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.MINION_SUMMONED_FROM_HAND;
	}
}
